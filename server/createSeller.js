import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; // Ensure path matches your structure
import 'dotenv/config'; // Loads .env variables

const injectSeller = async () => {
    try {
        // 1. Connect to Database
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log("✅ Database Connected");

        const sellerEmail = "seller@test.com";
        const sellerPassword = "12345678";

        // 2. Check if seller exists
        const existingSeller = await User.findOne({ email: sellerEmail });
        if (existingSeller) {
            console.log(`⚠️  User ${sellerEmail} already exists.`);
            console.log("👉 Please delete it from MongoDB or use a different email.");
            process.exit();
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(sellerPassword, salt);

        // 4. Create Seller Object
        const newSeller = new User({
            name: "Test Seller",
            email: sellerEmail,
            password: hashedPassword,
            role: "seller",        // <--- The Critical Role
            shopName: "Super Fresh Mart",
            cartItems: {}
        });

        // 5. Save to DB
        await newSeller.save();

        console.log("\n=================================");
        console.log("🎉 SUCCESS: Seller Injected!");
        console.log(`📧 Email:    ${sellerEmail}`);
        console.log(`🔑 Password: ${sellerPassword}`);
        console.log(`🏪 Shop:     Super Fresh Mart`);
        console.log("=================================\n");

        process.exit();
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
};

injectSeller();