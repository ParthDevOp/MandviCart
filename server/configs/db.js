// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // We use process.env.MONGODB_URI because that is what is in your .env file
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;