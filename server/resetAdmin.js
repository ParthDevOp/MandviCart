import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; 

const resetAdmin = async () => {
  try {
    // 1. Connect
    const mongoURI = "mongodb+srv://mandvicart:mandvicart3107@cluster0.o3ontth.mongodb.net/greencart?appName=Cluster0";
    console.log('🔌 Connecting...');
    await mongoose.connect(mongoURI);
    
    // 2. DELETE OLD ADMIN (The Fix)
    console.log('🗑️  Deleting old Super Admin...');
    await User.findOneAndDelete({ email: 'owner@mandvicart.com' });

    // 3. CREATE NEW ADMIN
    console.log('🆕 Creating fresh Super Admin...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt); 

    const superAdmin = new User({
      name: 'Parth Shah',
      email: 'owner@mandvicart.com',
      password: hashedPassword,
      role: 'superadmin',
      isVerified: true
    });

    await superAdmin.save();
    console.log('✅ SUCCESS: Super Admin has been reset!');
    console.log('🔑 New Password: Admin@123');
    
    process.exit();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();