import Banner from "../models/Banner.js";
import FlashSale from "../models/FlashSale.js";
import FeatureBanner from "../models/FeatureBanner.js";
import Content from "../models/Content.js"; 
import { v2 as cloudinary } from "cloudinary";

// ==========================================
// 🟢 1. UNIFIED UPDATE (For Super Admin Content Manager)
// ==========================================
export const updateContent = async (req, res) => {
    try {
        const { section, data } = req.body;
        
        // Save to Content model, keeping the active state synced
        await Content.findOneAndUpdate(
            { section },
            { section, data, isActive: data.active !== false },
            { new: true, upsert: true }
        );

        res.json({ success: true, message: "Content Updated Successfully" });
    } catch (error) {
        console.error("Content Update Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. HERO BANNERS (Specific Handlers)
// ==========================================
export const getBanners = async (req, res) => {
    try {
        const content = await Content.findOne({ section: 'hero_banner' });
        
        if (content && content.isActive && content.data && content.data.length > 0) {
             return res.json({ success: true, banners: content.data });
        }

        const banners = await Banner.find({ active: true });
        res.json({ success: true, banners });
        
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

export const addBanner = async (req, res) => {
    try {
        const { title, subtitle, bgColor } = req.body;
        const imageFile = req.file; 
        if (!imageFile) return res.json({ success: false, message: "Image required" });

        const result = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });

        const newBanner = new Banner({ title, subtitle, bgColor, image: result.secure_url });
        await newBanner.save();
        res.json({ success: true, message: "Banner Added!" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Banner Deleted" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 3. FLASH SALE (Specific Handlers)
// ==========================================
export const getFlashSale = async (req, res) => {
    try {
        // Priority: Check Super Admin Config first
        const content = await Content.findOne({ section: 'flash_sale' });
        
        // 🟢 CRITICAL FIX: We removed 'isActive' check so the Admin panel ALWAYS gets the data
        if (content && content.data) {
             // Pass the active state explicitly to the frontend
             return res.json({ success: true, sale: { ...content.data, active: content.isActive } });
        }

        // Fallback: Legacy Model (Removed {active: true} filter!)
        const sale = await FlashSale.findOne().sort({ _id: -1 }); 
        
        if (sale) {
            return res.json({ success: true, sale });
        }

        return res.json({ success: false, message: "No flash sale found." });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

export const updateFlashSale = async (req, res) => {
    try {
        const { title, subtitle, discount, endDate, active } = req.body;
        
        await FlashSale.deleteMany({}); 

        // 🟢 THE FIX: Safely parse the date so we don't pass "" to Mongoose
        const validEndDate = endDate ? new Date(endDate) : null;

        const sale = new FlashSale({
            title, 
            subtitle, 
            discount,
            endTime: validEndDate, 
            endDate: validEndDate,
            startTime: Date.now(),
            active: active !== undefined ? active : true 
        });
        
        await sale.save();
        
        // 🟢 Keep the Super Admin Content document synced as well
        await Content.findOneAndUpdate(
            { section: 'flash_sale' },
            { section: 'flash_sale', data: sale, isActive: sale.active },
            { new: true, upsert: true }
        );

        res.json({ success: true, message: "Flash Sale Updated" });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

// ==========================================
// 4. FEATURE BANNER & UTILS
// ==========================================
export const getFeaturedBanner = async (req, res) => {
    try {
        const content = await Content.findOne({ section: 'feature_banner' });
        if (content && content.isActive && content.data) {
             return res.json({ success: true, banner: content.data });
        }
        const banner = await FeatureBanner.findOne({ active: true });
        res.json({ success: true, banner });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const updateFeatureBanner = async (req, res) => {
    try {
        const { mainTitle, features } = req.body;
        const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;

        await FeatureBanner.deleteMany({});
        const newBanner = { mainTitle, mainImage: "https://res.cloudinary.com/demo/image/upload/v1699999999/sample.jpg", features: parsedFeatures, active: true };
        await FeatureBanner.create(newBanner);
        res.json({ success: true, message: "Feature Section Updated!" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const seedBanners = async (req, res) => { res.json({message: "Use Add Banner in Admin Panel"}) };
export const seedFlashSale = async (req, res) => { res.json({message: "Use Update Flash Sale in Admin Panel"}) };
export const seedFeaturedBanner = async (req, res) => { res.json({message: "Use Update Feature in Admin Panel"}) };