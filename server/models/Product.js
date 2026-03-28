import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: Array, required: true }, 
    image: { type: Array, required: true },
    category: { type: String, required: true }, 
    subCategory: { type: String },
    
    // Variants
    variants: [
        {
            weight: { type: String, required: true },
            price: { type: Number, required: true }, 
            offerPrice: { type: Number, required: true },
            inStock: { type: Boolean, default: true }
        }
    ],
    
    price: { type: Number, required: true },      
    offerPrice: { type: Number, required: true }, 
    inStock: { type: Boolean, default: true },    
    bestseller: { type: Boolean, default: false },
    
    // 🟢 NEW: Product Approval Pipeline Flag
    isApproved: { type: Boolean, default: false },
rejectionReason: { type: String, default: "" },
    sellerId: { type: String, required: true },
    date: { type: Number, required: true }, 

    reviews: [
        {
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String, required: true },
            date: { type: Number, default: Date.now }
        }
    ],
    averageRating: { type: Number, default: 4.5 }, 
    numberOfReviews: { type: Number, default: 0 }

}, { minimize: false, timestamps: true }); 

const Product = mongoose.models.product || mongoose.model("product", productSchema);

export default Product;