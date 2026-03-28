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

// ==========================================
// 🛡️ SMART PASSWORD HASHING MIDDLEWARE
// ==========================================
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // 🟢 FIXED "DOUBLE-HASH" BUG: 
  // If a controller (like createAccount) already hashed the password using bcrypt,
  // it will start with $2a$ or $2b$. We skip hashing it again to prevent breaking login!
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if(!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🟢 Safely export the model to prevent overwrite errors during server restarts
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;