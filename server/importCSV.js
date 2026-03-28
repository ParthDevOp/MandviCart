import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import Product from './models/product.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = "mongodb+srv://mandvicart:mandvicart3107@cluster0.o3ontth.mongodb.net/greencart?appName=Cluster0";
const SELLER_ID = new mongoose.Types.ObjectId("69b291f6af9592fee026420b");

const importData = async () => {
    try {
        console.log("⏳ Connecting to Mandvi Cart Cluster...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB.");

        // Store products grouped by category
        const productsByCategory = {};
        const allParsedProducts = [];

        console.log("📖 Reading CSV file to group categories...");
        
        fs.createReadStream('BigBasketProducts.csv') // Ensure exact filename
            .pipe(csv())
            .on('data', (row) => {
                if (row.product && row.sale_price) {
                    const categoryName = row.category || "General";
                    
                    const newProduct = {
                        name: row.product,
                        description: [row.description || "Premium quality product delivered by Mandvi Cart."],
                        image: ["https://via.placeholder.com/400"], 
                        category: categoryName,
                        subCategory: row.sub_category || categoryName,
                        brand: row.brand || "Generic", 
                        
                        price: parseFloat(row.market_price) || parseFloat(row.sale_price),
                        offerPrice: parseFloat(row.sale_price),
                        inStock: true,
                        bestseller: parseFloat(row.rating) >= 4.0, // Mark high rated as bestseller
                        sellerId: SELLER_ID,
                        date: Date.now(),
                        
                        averageRating: parseFloat(row.rating) || Math.floor(Math.random() * 2) + 3, // Random 3-5 if missing
                        numberOfReviews: 0,
                        reviews: [],

                        variants: [
                            {
                                weight: row.type || "Standard Pack",
                                price: parseFloat(row.market_price) || parseFloat(row.sale_price),
                                offerPrice: parseFloat(row.sale_price),
                                inStock: true
                            }
                        ]
                    };

                    allParsedProducts.push(newProduct);

                    if (!productsByCategory[categoryName]) {
                        productsByCategory[categoryName] = [];
                    }
                    productsByCategory[categoryName].push(newProduct);
                }
            })
            .on('end', async () => {
                console.log(`📦 Successfully loaded ${allParsedProducts.length} base items from CSV.`);

                // ==========================================
                // 1. ESTABLISH NEW CUSTOM CATEGORIES
                // ==========================================
                const newCategoriesToEstablish = [
                    "Electronics & Gadgets", 
                    "Toys & Games", 
                    "Fitness & Sports", 
                    "Home Appliances"
                ];

                console.log(`✨ Establishing ${newCategoriesToEstablish.length} brand new categories...`);
                
                newCategoriesToEstablish.forEach(newCat => {
                    productsByCategory[newCat] = [];
                    // Borrow 10 random products from our pool to act as base templates for the new category
                    for(let i = 0; i < 10; i++) {
                        const randomProduct = allParsedProducts[Math.floor(Math.random() * allParsedProducts.length)];
                        const clonedProduct = JSON.parse(JSON.stringify(randomProduct));
                        clonedProduct.category = newCat; // Reassign to new category
                        clonedProduct.subCategory = newCat;
                        clonedProduct.name = `${newCat} Special Item ${i + 1}`; // Rename it
                        productsByCategory[newCat].push(clonedProduct);
                    }
                });

                // ==========================================
                // 2. ENFORCE EXACTLY 100 ITEMS PER CATEGORY
                // ==========================================
                console.log("⚙️ Formatting database so EVERY category has exactly 100 items...");
                const finalProductsToInsert = [];

                for (const [category, products] of Object.entries(productsByCategory)) {
                    let count = 0;
                    
                    while (count < 100) {
                        // Pick a base product. If we run out of unique products, it loops back to the start
                        const baseProduct = products[count % products.length];
                        const finalProduct = JSON.parse(JSON.stringify(baseProduct)); // Deep copy
                        
                        // If we are duplicating an item to reach 100, tweak the name so it looks unique on the frontend
                        if (count >= products.length) {
                            finalProduct.name = `${baseProduct.name} - Pack ${Math.floor(count / products.length) + 1}`;
                        }
                        
                        finalProductsToInsert.push(finalProduct);
                        count++;
                    }
                }

                // ==========================================
                // 3. UPLOAD TO DATABASE
                // ==========================================
                try {
                    console.log(`🚀 Wiping old items...`);
                    await Product.deleteMany({}); 
                    
                    console.log(`📦 Pushing ${finalProductsToInsert.length} perfectly sorted products into database...`);
                    await Product.insertMany(finalProductsToInsert);
                    
                    console.log("✅ Success! Check your website. Every category now has exactly 100 items.");
                    process.exit();
                } catch (err) {
                    console.error("❌ Error pushing to database:", err);
                    process.exit(1);
                }
            });
    } catch (error) {
        console.error("❌ Connection error:", error);
        process.exit(1);
    }
};

importData();