import User from "../models/User.js";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js"; 
import Query from "../models/Query.js"; 
import ActivityLog from "../models/ActivityLog.js"; 
import SystemSetting from "../models/SystemSetting.js"; 
import Payout from "../models/Payout.js"; 
import Address from "../models/Address.js"; 
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from "cloudinary";
import crypto from 'crypto'; 
import sendEmail from '../configs/sendEmail.js'; 

// 🟢 IMPORT CLERK SDK: Used for reverse-syncing (Admin -> Clerk)
import { clerkClient } from '@clerk/clerk-sdk-node';

const createToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 🔹 HELPER: Generate & Send 6-Digit OTP (Legacy support)
const generateAndSendOTP = async (user, subject, messageText) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    user.otp = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 5 * 60 * 1000; 
    await user.save({ validateBeforeSave: false });

    const emailTemplate = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0;">
            <h2 style="color: #16a34a; margin-bottom: 20px;">GreenCart Security</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">${messageText}</p>
            <div style="background-color: #ffffff; border: 2px dashed #22c55e; padding: 20px; border-radius: 12px; display: inline-block; margin: 30px 0;">
                <h1 style="letter-spacing: 8px; color: #15803d; margin: 0; font-size: 32px;">${otp}</h1>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">This secure code expires in 5 minutes. Please do not share it with anyone.</p>
        </div>
    `;
    
    await sendEmail({ email: user.email, subject, message: emailTemplate });
};

// ==========================================
// 🔓 1. REGISTRATION FLOW (Legacy Support)
// ==========================================
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (role === 'admin' || role === 'superadmin') {
            return res.json({ success: false, message: "Cannot register as Admin publicly." });
        }

        if (!validator.isEmail(email)) return res.json({ success: false, message: "Invalid email format." });
        if (password.length < 8) return res.json({ success: false, message: "Password must be at least 8 characters." });

        let user = await User.findOne({ email });

        if (user && user.isVerified) {
            return res.json({ success: false, message: "User already exists. Please login." });
        }

        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = new User({ 
                name, 
                email, 
                password: hashedPassword, 
                role: role || 'user', 
                isVerified: false 
            });
        } else {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.name = name;
        }

        await generateAndSendOTP(user, "Verify Your GreenCart Account", "Welcome to GreenCart! Use the OTP below to verify your email address and activate your account.");
        res.json({ success: true, message: "Verification OTP sent to your email." });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp, guestCart } = req.body;
        
        if(!otp || otp.length !== 6) return res.json({ success: false, message: "Invalid OTP format." });

        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({ 
            email, 
            otp: hashedOTP, 
            otpExpires: { $gt: Date.now() } 
        });

        if (!user) return res.json({ success: false, message: "Invalid or expired OTP." });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        if (guestCart && Object.keys(guestCart).length > 0) {
            let dbCart = user.cartItems || {};
            for (const itemId in guestCart) {
                if (dbCart[itemId]) {
                    for (const size in guestCart[itemId]) {
                        dbCart[itemId][size] = (dbCart[itemId][size] || 0) + guestCart[itemId][size];
                    }
                } else {
                    dbCart[itemId] = guestCart[itemId];
                }
            }
            user.cartItems = dbCart; 
        }

        await user.save();
        const token = createToken(user._id, user.role);
        res.json({ success: true, token, role: user.role, user, message: "Account Verified Successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 🔓 2. LOGIN FLOW (Legacy Support)
// ==========================================
export const login = async (req, res) => {
    try {
        const { email, password, guestCart } = req.body; 
        const user = await User.findOne({ email });

        if (!user) return res.json({ success: false, message: "User not found" });

        if (user.isBlocked) {
            return res.json({ success: false, message: "Your account has been suspended. Contact support." });
        }

        if (!user.isVerified) {
            await generateAndSendOTP(user, "Verify Your GreenCart Account", "You must verify your email before logging in.");
            return res.json({ success: false, requireVerification: true, message: "Account not verified. A new OTP has been sent." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            const token = createToken(user._id, user.role);
            if (guestCart && Object.keys(guestCart).length > 0) {
                let dbCart = user.cartItems || {};
                for (const itemId in guestCart) {
                    if (dbCart[itemId]) {
                        for (const size in guestCart[itemId]) {
                            dbCart[itemId][size] = (dbCart[itemId][size] || 0) + guestCart[itemId][size];
                        }
                    } else {
                        dbCart[itemId] = guestCart[itemId];
                    }
                }
                user.cartItems = dbCart; 
                await user.save();
            }
            res.json({ success: true, token, role: user.role, user: user });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 🔑 3. FORGOT PASSWORD FLOW
// ==========================================
export const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.json({ success: false, message: "There is no user with that email address." });
        if (!user.isVerified) return res.json({ success: false, message: "Unverified accounts cannot reset passwords."});

        await generateAndSendOTP(user, "GreenCart Password Reset", "Use this OTP to authorize your password reset request.");
        res.json({ success: true, message: 'OTP sent to your email!' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (newPassword.length < 8) return res.json({ success: false, message: "Password must be at least 8 characters." });
        if(!otp || otp.length !== 6) return res.json({ success: false, message: "Invalid OTP format." });

        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        const user = await User.findOne({ email, otp: hashedOTP, otpExpires: { $gt: Date.now() } });

        if (!user) return res.json({ success: false, message: "Invalid or expired OTP." });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 👤 USER PROFILE & UTILS
// ==========================================
export const isAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        res.json({ success: true, message: "Authenticated", role: user.role, user: user });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, shopName, vehicleNumber, upiId } = req.body;
        
        let address = req.body.address;
        let bankAccount = req.body.bankAccount;

        if (typeof address === 'string') {
            try { address = JSON.parse(address); } catch (e) { console.error("Address Parse Fail", e); }
        }
        if (typeof bankAccount === 'string') {
            try { bankAccount = JSON.parse(bankAccount); } catch (e) { console.error("Bank Parse Fail", e); }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (shopName) updateData.shopName = shopName;
        if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
        if (upiId) updateData.upiId = upiId;
        if (address) updateData.address = address;
        if (bankAccount) updateData.bankAccount = bankAccount;

        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
                updateData.profileImage = result.secure_url;
            } catch (err) { console.error("Cloudinary Error:", err); }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!updatedUser) return res.json({ success: false, message: "User not found" });

        res.json({ success: true, message: "Profile Updated Successfully", user: updatedUser });
    } catch (error) {
        console.error("Update Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId }).sort({ date: -1 });
        res.json({ success: true, notifications });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const subscribeToNewsletter = async (req, res) => {
    res.json({ success: true, message: "Subscribed successfully!" });
};

export const submitQuery = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) return res.json({ success: false, message: "Fill all fields" });
        const newQuery = new Query({ name, email, subject, message });
        await newQuery.save();
        res.json({ success: true, message: "Message sent!" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 🛡️ ADMIN MANAGEMENT ROUTES
// ==========================================
export const createAccount = async (req, res) => {
    try {
        const { name, email, password, role, shopName, vehicleNumber } = req.body;
        
        // 🟢 SAFE CHECK: Verify the admin making the request
        const adminMakingRequest = await User.findById(req.userId);

        // 1. Security Check
        if((role === 'admin' || role === 'superadmin') && adminMakingRequest.role !== 'superadmin') {
            return res.json({ success: false, message: "Only Super Admins can create new Admins." });
        }

        // 2. Database Existence Check
        const exists = await User.findOne({ email });
        if (exists) return res.json({ success: false, message: "User exists in database." });
        if (password.length < 8) return res.json({ success: false, message: "Password must be at least 8 characters." });

        const salt = await bcrypt.genSalt(10);
        const dummyHashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);

        const newUser = new User({
            name, 
            email, 
            password: dummyHashedPassword, 
            role, 
            shopName: role === 'seller' ? shopName : undefined,
            vehicleNumber: role === 'rider' ? vehicleNumber : undefined,
            isVerified: true
        });

        await newUser.save();

        let newClerkId = '';
        try {
            const clerkUser = await clerkClient.users.createUser({
                emailAddress: [email],
                password: password, 
                firstName: name.split(' ')[0] || name,
                lastName: name.split(' ').slice(1).join(' ') || '',
                skipPasswordChecks: true,
                skipPasswordRequirement: false,
            });
            newClerkId = clerkUser.id;
        } catch (clerkError) {
            await User.findByIdAndDelete(newUser._id);
            return res.json({ 
                success: false, 
                message: clerkError.errors?.[0]?.message || "Failed to create user in Clerk Auth." 
            });
        }

        newUser.clerkId = newClerkId;
        await newUser.save();

        if (adminMakingRequest.role === 'superadmin') {
            await ActivityLog.create({
                actorId: req.userId, actorName: adminMakingRequest.name, role: 'superadmin',
                action: 'CREATED_USER', target: `${role}: ${email}`, details: { role }
            });
        }

        res.json({ success: true, message: `${role} created successfully in both Clerk and Database!` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query; 
        let query = {};
        if (role) query.role = role;

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const adminUpdateUser = async (req, res) => {
    try {
        const { userId, name, email, role, shopName, vehicleNumber } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        // 🟢 SAFE CHECK: If role is being changed, verify permissions
        if (role && role !== user.role) {
            const adminMakingRequest = await User.findById(req.userId);
            if ((role === 'admin' || role === 'superadmin') && adminMakingRequest.role !== 'superadmin') {
                return res.json({ success: false, message: "Only Super Admins can promote to Admin roles." });
            }
            user.role = role;
        }

        if(name) user.name = name;
        if(email) user.email = email;
        if(user.role === 'seller' && shopName) user.shopName = shopName;
        if(user.role === 'rider' && vehicleNumber) user.vehicleNumber = vehicleNumber;

        await user.save();
        res.json({ success: true, message: "User details updated securely" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const changeUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        
        if (req.userId === userId) return res.json({ success: false, message: "Cannot change your own role." });

        // 🟢 SAFE CHECK: Fetch the admin who clicked the button to verify permissions
        const adminMakingRequest = await User.findById(req.userId);

        if ((newRole === 'admin' || newRole === 'superadmin') && adminMakingRequest.role !== 'superadmin') {
            return res.json({ success: false, message: "Security Alert: Only Super Admins can grant Admin privileges." });
        }

        await User.findByIdAndUpdate(userId, { role: newRole });
        res.json({ success: true, message: `User promoted to ${newRole}` });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const adminToggleBlock = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        user.isBlocked = !user.isBlocked; 
        await user.save();

        res.json({ 
            success: true, 
            message: user.isBlocked ? "User banned 🚫" : "User active ✅",
            isBlocked: user.isBlocked 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 🟢 NEW: ADMIN "DEEP DIVE" READ-ONLY VIEW
export const getUserDeepInfo = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const targetUser = await User.findById(targetUserId).select('-password');
        if (!targetUser) return res.json({ success: false, message: "User not found" });

        const orders = await Order.find({ userId: targetUserId }).sort({ date: -1 }).limit(10);
        const addresses = await Address.find({ userId: targetUserId });

        let safeBankAccount = targetUser.bankAccount ? { ...targetUser.bankAccount } : null;
        let safeUpiId = targetUser.upiId;

        if (req.user.role === 'admin') {
            if (safeBankAccount && safeBankAccount.accountNumber) {
                safeBankAccount.accountNumber = `••••${safeBankAccount.accountNumber.slice(-4)}`;
                safeBankAccount.ifsc = "HIDDEN";
            }
            if (safeUpiId) {
                safeUpiId = "••••@upi";
            }
        }

        res.json({
            success: true,
            data: {
                user: { 
                    ...targetUser.toObject(), 
                    bankAccount: safeBankAccount, 
                    upiId: safeUpiId 
                },
                cart: targetUser.cartItems || {},
                orders,
                addresses
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const adminResetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (newPassword.length < 8) return res.json({ success: false, message: "Password must be 8+ chars" });

        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        if (user.clerkId) {
            try {
                await clerkClient.users.updateUser(user.clerkId, {
                    password: newPassword,
                    skipPasswordChecks: true
                });
            } catch (err) {
                return res.json({ success: false, message: `Clerk Error: ${err.errors?.[0]?.message}` });
            }
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: "Password updated successfully in both Database and Clerk" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.body.id);
        if (!user) return res.json({ success: false, message: "User not found" });

        if (user.clerkId) {
            try {
                await clerkClient.users.deleteUser(user.clerkId);
            } catch (err) {
                console.log("⚠️ Clerk Delete skipped:", err.errors?.[0]?.message || err.message);
            }
        }

        await User.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "User permanently deleted from database and Clerk Auth!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const totalProducts = await Product.countDocuments({});
        const totalOrders = await Order.countDocuments({});
        
        const revenueAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        const monthlyData = await Order.aggregate([
            { $match: { date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
            { $group: { _id: { $month: { $toDate: "$date" } }, revenue: { $sum: "$amount" }, orders: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedChartData = monthlyData.map(item => ({
            name: monthNames[item._id - 1], revenue: item.revenue, orders: item.orders
        }));

        res.json({
            success: true,
            stats: {
                totalUsers, totalProducts, totalOrders, totalRevenue,
                monthlyData: formattedChartData.length > 0 ? formattedChartData : [{name: 'Current', revenue: 0, orders: 0}]
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 👑 SUPER ADMIN EXCLUSIVE FUNCTIONS
// ==========================================
export const getSuperAdminStats = async (req, res) => {
    try {
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalRiders = await User.countDocuments({ role: 'rider' });
        const totalSellers = await User.countDocuments({ role: 'seller' });
        
        // Income
        const orderStats = await Order.aggregate([
            { $match: { payment: true } }, 
            { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalOrders: { $sum: 1 } } }
        ]);
        const totalRevenue = orderStats[0]?.totalRevenue || 0;
        const totalOrders = orderStats[0]?.totalOrders || 0;

        // Exact Platform Profit
        const completedOrders = await Order.find({ payment: true });
        const platformProfit = completedOrders.reduce((acc, order) => acc + (order.platformFee || 0), 0);

        // Enhanced Payout & Obligations Breakdown
        const payoutStatsAgg = await Payout.aggregate([
            { $group: { _id: "$status", totalAmount: { $sum: "$amount" } } }
        ]);
        const pendingPayouts = payoutStatsAgg.find(p => p._id === 'pending')?.totalAmount || 0;
        const completedPayouts = payoutStatsAgg.find(p => p._id === 'paid')?.totalAmount || 0;

        // Recent 10 Withdrawals
        const recentWithdrawals = await Payout.find({})
            .populate('userId', 'name email')
            .sort({ requestDate: -1, createdAt: -1 })
            .limit(10);

        // Top Partner Balances Ledger
        const partners = await User.find({ role: { $in: ['seller', 'rider'] } }).select('name role pendingWithdrawals totalWithdrawn');
        
        const topPartnerBalances = await Promise.all(partners.map(async (p) => {
            let totalEarnings = 0;
            if (p.role === 'seller') {
                const orders = await Order.find({ sellerId: p._id, status: 'Delivered' });
                totalEarnings = orders.reduce((sum, order) => sum + (order.sellerEarnings || 0), 0);
            } else {
                const orders = await Order.find({ riderId: p._id, status: 'Delivered' });
                totalEarnings = orders.reduce((sum, order) => sum + (order.riderEarnings || order.deliveryFee || 40), 0);
            }
            
            const pending = p.pendingWithdrawals || 0;
            const withdrawn = p.totalWithdrawn || 0;
            const availableBalance = Math.max(0, totalEarnings - pending - withdrawn);

            return { name: p.name, role: p.role, availableBalance, pendingWithdrawals: pending };
        }));

        topPartnerBalances.sort((a, b) => b.availableBalance - a.availableBalance);
        const top15Balances = topPartnerBalances.filter(b => b.availableBalance > 0 || b.pendingWithdrawals > 0).slice(0, 15);

        // Over Time Graph
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyData = await Order.aggregate([
            { $match: { payment: true, date: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: { $toDate: "$date" } }, year: { $year: { $toDate: "$date" } } },
                revenue: { $sum: "$amount" }, platformEarnings: { $sum: "$platformFee" }, count: { $sum: 1 }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedGraphData = monthlyData.map(item => ({
            date: monthNames[item._id.month - 1], revenue: item.revenue, payout: item.platformEarnings 
        }));

        // 🟢 NEW: Inventory Analysis
        const stockData = await Product.aggregate([
            { $group: { _id: "$inStock", count: { $sum: 1 } } }
        ]);
        const inStockCount = stockData.find(s => s._id === true)?.count || 0;
        const outOfStockCount = stockData.find(s => s._id === false)?.count || 0;

        // 🟢 NEW: Logistics Status Pipeline
        const logisticsAgg = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const logisticsStatus = logisticsAgg.map(item => ({
            name: item._id, count: item.count
        }));

        // 🟢 NEW: Top Selling Items (unwinding order items to count frequencies)
        const topSellingAgg = await Order.aggregate([
            { $match: { payment: true } },
            { $unwind: "$items" },
            { $group: { 
                _id: "$items.product.name", 
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.quantity", "$items.product.offerPrice"] } }
            }},
            { $sort: { totalSold: -1 } },
            { $limit: 7 }
        ]);

        const topProducts = topSellingAgg.map(item => ({
            name: item._id || "Unknown Product", sold: item.totalSold, revenue: item.revenue
        }));

        res.json({
            success: true,
            stats: {
                users: { admin: totalAdmins, customer: totalUsers, rider: totalRiders, seller: totalSellers },
                financials: { revenue: totalRevenue, orders: totalOrders },
                earningsSplit: { platform: platformProfit },
                payoutBreakdown: { pending: pendingPayouts, paid: completedPayouts },
                recentWithdrawals,
                topPartnerBalances: top15Balances,
                revenueOverTime: formattedGraphData,
                inventory: { inStock: inStockCount, outOfStock: outOfStockCount },
                logistics: logisticsStatus,
                topProducts: topProducts
            }
        });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// ⚙️ 7. SYSTEM & NOTIFICATIONS
// ==========================================
export const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) settings = await SystemSetting.create({}); 
        res.json({ success: true, settings });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const updateSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        
        await ActivityLog.create({
            actorId: req.userId, actorName: req.user.name, role: "superadmin",
            action: "UPDATED_SETTINGS", target: "System Config", details: req.body
        });

        res.json({ success: true, message: "Settings Updated", settings });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const sendAnnouncement = async (req, res) => {
    try {
        const { title, message, target } = req.body;
        
        let query = {};
        if (target !== 'all') {
            query.role = target;
        }

        const users = await User.find(query, '_id');
        
        if (users.length === 0) return res.json({ success: false, message: "No users found for this target." });

        const notifications = users.map(u => ({
            userId: u._id,
            title,
            message,
            type: 'system',
            date: Date.now()
        }));

        await Notification.insertMany(notifications);

        await ActivityLog.create({
            actorId: req.userId, actorName: req.user.name, role: 'superadmin',
            action: 'BROADCAST_MSG', target: `Target: ${target}`, details: { title, count: users.length }
        });

        res.json({ success: true, message: `Sent to ${users.length} users!` });

    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const seedNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({});
        const users = await User.find({}, '_id');
        const notifications = users.map(user => ({
            userId: user._id, title: "Welcome to GreenCart! 🌿", message: "System operational.", type: "system", date: Date.now()
        }));
        await Notification.insertMany(notifications);
        res.json({ success: true, message: "Notifications seeded" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 🟢 NEW: CLERK TO MONGODB JUST-IN-TIME SYNC
// ==========================================
export const clerkLoginSync = async (req, res) => {
    try {
        const { clerkId } = req.body;

        if (!clerkId) {
            return res.json({ success: false, message: "No Clerk ID provided." });
        }

        // 1. Try to find user directly by clerkId
        let user = await User.findOne({ clerkId }).select("-password");

        // 2. If user doesn't exist, create them JIT (Just-In-Time)
        if (!user) {
            console.log("New user detected! Fetching from Clerk and saving to MongoDB...");
            
            // Securely fetch details from Clerk using the backend SDK
            const clerkUser = await clerkClient.users.getUser(clerkId);
            const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
            const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "New User";

            // Check if they existed from an old manual registration first
            user = await User.findOne({ email: primaryEmail });
            
            if (user) {
                // Link the old account to the new Clerk ID
                user.clerkId = clerkId;
                if (!user.name) user.name = fullName;
                if (clerkUser.imageUrl && !user.profileImage) user.profileImage = clerkUser.imageUrl;
                user.isVerified = true;
                await user.save();
            } else {
                // Create a completely new user
                const salt = await bcrypt.genSalt(10);
                const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);

                user = new User({
                    clerkId: clerkId,
                    name: fullName,
                    email: primaryEmail,
                    password: dummyPassword, // Mongoose might require this field
                    profileImage: clerkUser.imageUrl || "",
                    role: "user", // Default role
                    cartItems: {},
                    isVerified: true
                });
                await user.save();
            }
            console.log("User provisioned instantly!");
        }

        // 3. Issue the standard system token
        const token = createToken(user._id, user.role);

        res.json({ 
            success: true, 
            token, 
            role: user.role, 
            user 
        });

    } catch (error) {
        console.error("Clerk Sync Creation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};