import mongoose from 'mongoose';
import User from './models/User.js'; 

const createSuperAdmin = async () => {
  try {
    // 1. Connect
    const mongoURI = "mongodb+srv://mandvicart:mandvicart3107@cluster0.o3ontth.mongodb.net/greencart?appName=Cluster0";
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected');

    // 2. Create User with PLAIN TEXT password
    // Your User model will automatically hash this!
    const superAdmin = new User({
      name: 'Parth Shah',
      email: 'owner@mandvicart.com',
      password: 'Admin@123', // <--- sending plain text now
      role: 'superadmin',
      isVerified: true
    });

    await superAdmin.save();
    console.log('🎉 Super Admin Created!');
    console.log('🔑 Password: Admin@123');
    
    process.exit();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createSuperAdmin();