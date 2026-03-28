import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js"; 
import User from "../models/User.js";
import Notification from "../models/Notification.js"; 

export const addProduct = async (req, res) => {
    try {
        if (!req.userId) return res.json({ success: false, message: "User ID missing" });

        let productData = JSON.parse(req.body.productData);
        const imageFiles = req.files || []; 
        const imagesUrl = await Promise.all(
            imageFiles.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

        const firstVariant = productData.variants?.[0] || { price: 0, offerPrice: 0 };
        
        const product = new Product({
            ...productData, 
            image: imagesUrl, 
            sellerId: req.userId, 
            date: Date.now(),
            price: Number(firstVariant.price), 
            offerPrice: Number(firstVariant.offerPrice), 
            inStock: true,
            // 🟢 NOTE: isApproved defaults to false automatically via the schema!
        });

        await product.save();

        const allUsers = await User.find({}, '_id');
        if (allUsers.length > 0) {
            const notifications = allUsers.map(user => ({
                userId: user._id, title: "New Arrival! 🌿", message: `Check out our fresh ${product.name}!`, type: "offer", date: Date.now()
            }));
            await Notification.insertMany(notifications);
        }
        res.json({ success: true, message: "Product Added (Pending Admin Approval)" });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

export const listProducts = async (req, res) => {
    try {
        // 🟢 FIX: Extract 'adminFetch' to determine if we show unapproved products
        const { category, subCategory, search, sort, adminFetch } = req.query;
        
        // If an Admin is fetching, show EVERYTHING. If a customer is fetching, show ONLY approved.
        let query = adminFetch === 'true' ? {} : { isApproved: true };

        if (category && category !== 'All') {
            query.category = { $in: category.split(',').map(cat => new RegExp(`^${cat}$`, "i")) };
        }
        if (subCategory && subCategory !== 'All') {
            query.subCategory = new RegExp(`^${subCategory}$`, "i");
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = sort === 'low-high' ? { offerPrice: 1 } : sort === 'high-low' ? { offerPrice: -1 } : { date: -1 };
        const products = await Product.find(query).sort(sortOption);
        res.json({ success: true, products });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

// ===============================================
// 🟢 NEW: Product Approval & Rejection Logic
// ===============================================

export const approveProduct = async (req, res) => {
    try {
        const { id } = req.body;
        // Approve it and wipe out any previous rejection reason
        const product = await Product.findByIdAndUpdate(
            id, 
            { isApproved: true, rejectionReason: "" }, 
            { new: true }
        );
        
        if (!product) return res.json({ success: false, message: "Product not found" });
        
        // Notify the Seller
        await Notification.create({
            userId: product.sellerId,
            title: "Product Approved! ✅",
            message: `Your product "${product.name}" is now live on the store.`,
            type: "success",
            date: Date.now()
        });

        res.json({ success: true, message: "Product approved and is now Live!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const rejectProduct = async (req, res) => {
    try {
        const { id, reason } = req.body;
        
        // Reject it and save the admin's feedback
        const product = await Product.findByIdAndUpdate(
            id, 
            { isApproved: false, rejectionReason: reason }, 
            { new: true }
        );
        
        if (!product) return res.json({ success: false, message: "Product not found" });

        // Notify the Seller so they know they need to fix something
        await Notification.create({
            userId: product.sellerId,
            title: "Product Rejected ❌",
            message: `Your product "${product.name}" requires changes. Reason: ${reason}`,
            type: "alert",
            date: Date.now()
        });

        res.json({ success: true, message: "Product rejected and seller notified." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ===============================================

export const updateProduct = async (req, res) => {
    try {
        let updateData = JSON.parse(req.body.productData);
        const { productId, name, description, category, subCategory, bestseller, variants } = updateData;
        const product = await Product.findById(productId);
        if (!product) return res.json({ success: false, message: "Product not found" });

        let updatedImages = [...product.image]; 
        const imageFiles = req.files || [];
        if (imageFiles.length > 0) {
            updatedImages = await Promise.all(imageFiles.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            }));
        }

        // When a seller updates their product, clear the rejection reason and mark as unapproved so Admin can review again
        Object.assign(product, { 
            name, description, category, subCategory, bestseller, variants, image: updatedImages,
            isApproved: false, 
            rejectionReason: "" 
        });
        
        if (variants?.length > 0) { product.price = variants[0].price; product.offerPrice = variants[0].offerPrice; }
        
        await product.save();
        res.json({ success: true, message: "Product Updated & Submitted for Review" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const listCategories = async (req, res) => {
    try {
        const categoriesData = await Product.aggregate([
            { $group: { _id: "$category", subCategories: { $addToSet: "$subCategory" } } },
            { $project: { _id: 0, category: "$_id", subCategories: 1 } },
            { $sort: { category: 1 } }
        ]);
        res.json({ success: true, count: categoriesData.length, categories: categoriesData });
    } catch (error) {
        res.json({ success: false, message: "Failed to fetch categories" });
    }
};

export const addProductReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const product = await Product.findById(productId);
        const user = await User.findById(req.userId);
        product.reviews.push({ userId: req.userId, userName: user.name, rating: Number(rating), comment, date: Date.now() });
        product.numberOfReviews = product.reviews.length;
        product.averageRating = product.reviews.reduce((sum, item) => sum + item.rating, 0) / product.reviews.length;
        await product.save();
        res.json({ success: true, message: "Review Added" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const removeProduct = async (req, res) => { try { await Product.findByIdAndDelete(req.body.id); res.json({ success: true, message: "Product Deleted" }); } catch (error) { res.json({ success: false, message: error.message }); } };
export const singleProduct = async (req, res) => { try { const p = await Product.findById(req.body.productId); res.json({ success: true, product: p }); } catch (error) { res.json({ success: false, message: error.message }); } };
export const updateStock = async (req, res) => { try { await Product.findByIdAndUpdate(req.body.id, { inStock: req.body.inStock }); res.json({ success: true, message: "Stock Updated" }); } catch (error) { res.json({ success: false, message: error.message }); } };
export const sellerProducts = async (req, res) => { try { const p = await Product.find({ sellerId: req.userId }).sort({ createdAt: -1 }); res.json({ success: true, products: p }); } catch (error) { res.json({ success: false, message: error.message }); } };