import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ==========================================
  // 🟢 AUTHENTICATION & IDENTITY
  // ==========================================
  clerkId: { type: String, default: '' }, 
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'seller', 'rider', 'user'],
    default: 'user', 
  },

  // ==========================================
  // 🟢 UNIVERSAL PROFILE FIELDS
  // ==========================================
  phone: { type: String, default: '' },
  profileImage: { type: String, default: '' }, 

  // ==========================================
  // 🟢 ROLE-SPECIFIC LOGISTICS
  // ==========================================
  shopName: { type: String, default: '' },      // For Sellers
  vehicleNumber: { type: String, default: '' }, // For Riders
  isOnline: { type: Boolean, default: false },  // For Rider Shift Tracking

  // ==========================================
  // 🟢 FINANCIALS & PAYOUTS
  // ==========================================
  upiId: { type: String, default: '' },
  bankAccount: {
    bankName: { type: String, default: '' },      // 👈 FIXED: Matches Frontend Smart Selector
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' }
  },
  pendingWithdrawals: { type: Number, default: 0 }, 
  totalWithdrawn: { type: Number, default: 0 },    

  // ==========================================
  // 🟢 ADDRESS STORAGE
  // ==========================================
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    street: { type: String, default: '' }, 
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },

  // ==========================================
  // 🟢 SECURITY & STATUS
  // ==========================================
  otp: { type: String },              // 👈 FIXED: Required for email verification logic
  otpExpires: { type: Date },         // 👈 FIXED: Required for OTP expiration math
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }, 

  // ==========================================
  // 🟢 E-COMMERCE CART
  // ==========================================
  cartItems: { type: Object, default: {} }
}, { 
  timestamps: true, 
  minimize: false 
});


userSchema.methods.matchPassword = async function(enteredPassword) {
  if(!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🟢 Safely export the model to prevent overwrite errors during server restarts
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;