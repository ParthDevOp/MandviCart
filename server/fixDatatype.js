import mongoose from 'mongoose';
import Product from './models/Product.js'; 
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = "mongodb+srv://mandvicart:mandvicart3107@cluster0.o3ontth.mongodb.net/greencart?appName=Cluster0";

const fixInventory = async () => {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected!");

        console.log("🔄 Fixing sellerId Data Types from ObjectId to String...");
        
        // This forces MongoDB to overwrite the sellerId with a plain string
        const result = await Product.updateMany(
            {}, 
            { $set: { sellerId: "69b291f6af9592fee026420b" } } 
        );

        console.log(`✨ Success! Fixed ${result.modifiedCount} products.`);
        console.log("🚀 Refresh your Seller Dashboard, your inventory will now appear!");
        
        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

fixInventory();