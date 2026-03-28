import userModel from "../models/User.js";
import orderModel from "../models/orderModel.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js"; 
import Query from "../models/Query.js"; 
import ActivityLog from "../models/ActivityLog.js"; 
import SystemSetting from "../models/SystemSetting.js"; 
import Payout from "../models/Payout.js"; 
import bcrypt from "bcryptjs";
import crypto from 'crypto'; 
import jwt from 'jsonwebtoken';
import { clerkClient } from '@clerk/clerk-sdk-node';

// ==========================================
// 1. DASHBOARD STATISTICS
// ==========================================
export const getDashboardStats = async (req, res) => {
    try {
        const usersCount = await userModel.countDocuments({ role: 'user' });
        const ordersCount = await orderModel.countDocuments({});
        const productsCount = await Product.countDocuments({});

        const completedOrders = await orderModel.find({ payment: true });
        
        const totalRevenue = completedOrders.reduce((acc, order) => acc + order.amount, 0);
        
        // 🟢 FIXED: Uses exact platform net profit calculated at checkout
        const platformEarnings = completedOrders.reduce((acc, order) => {
            return acc + (order.platformFee || 0);
        }, 0);

        const roleDistribution = await userModel.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        const statusStats = await orderModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const topProducts = await Product.find({})
            .sort({ price: -1 })
            .limit(5)
            .select('name price category');

        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const graphData = last7Days.map(date => {
            const dayOrders = completedOrders.filter(o => o.date && new Date(o.date).toISOString().startsWith(date));
            const dailyRevenue = dayOrders.reduce((acc, o) => acc + o.amount, 0);
            return { 
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                revenue: dailyRevenue 
            };
        });

        res.json({
            success: true,
            stats: {
                users: usersCount, orders: ordersCount, products: productsCount,
                revenue: totalRevenue, platformEarnings: platformEarnings
            },
            roleDistribution, statusStats, topProducts, graphData
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. USER MANAGEMENT & ROLE UPGRADES
// ==========================================
export const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, '-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const updateUserDetails = async (req, res) => {
    try {
        const { userId, name, email, phone, role } = req.body;
        
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        // 🟢 SECURITY: Check Role Upgrade Permissions
        if (role && role !== user.role) {
            const adminMakingRequest = await userModel.findById(req.userId);
            
            // Only Superadmin can promote to admin/superadmin
            if ((role === 'admin' || role === 'superadmin') && adminMakingRequest.role !== 'superadmin') {
                return res.json({ success: false, message: "Only Super Admins can assign Admin privileges." });
            }
            user.role = role;
        }

        if(name) user.name = name;
        if(email) user.email = email;
        if(phone) user.phone = phone;

        await user.save();
        res.json({ success: true, message: "User details updated", user });
    } catch (error) { res.json({ success: false, message: error.message }); }
}

export const changeUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        
        if (req.userId === userId) return res.json({ success: false, message: "Cannot change your own role." });

        const adminMakingRequest = await userModel.findById(req.userId);

        // 🟢 SECURITY: Normal Admin can only promote to rider/seller/user. Superadmin can promote to admin.
        if ((newRole === 'admin' || newRole === 'superadmin') && adminMakingRequest.role !== 'superadmin') {
            return res.json({ success: false, message: "Security Alert: Only Super Admins can grant Admin privileges." });
        }

        await userModel.findByIdAndUpdate(userId, { role: newRole });
        res.json({ success: true, message: `User successfully promoted to ${newRole}` });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const toggleBlockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });
        if (user.role === 'superadmin') return res.json({ success: false, message: "Cannot block Super Admin" });

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ success: true, message: user.isBlocked ? "User Blocked" : "User Unblocked" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        await userModel.findByIdAndDelete(id);
        res.json({ success: true, message: "User Deleted Permanently" });
    } catch (error) { res.json({ success: false, message: error.message }); }
}

// ==========================================
// 3. SUPPORT TICKETS & NOTIFICATIONS
// ==========================================
export const getSupportTickets = async (req, res) => {
    try {
        const tickets = await Query.find({}).sort({ date: -1 });
        res.json({ success: true, tickets });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const closeTicket = async (req, res) => {
    try {
        await Query.findByIdAndUpdate(req.body.id, { status: 'Resolved' });
        res.json({ success: true, message: "Ticket Resolved" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const sendAnnouncement = async (req, res) => {
    try {
        const { title, message, target } = req.body;
        let query = target !== 'all' ? { role: target } : {};
        const users = await userModel.find(query, '_id');
        
        if (users.length === 0) return res.json({ success: false, message: "No users found for this target." });

        const notifications = users.map(u => ({
            userId: u._id, title, message, type: 'system', date: Date.now()
        }));

        await Notification.insertMany(notifications);
        await ActivityLog.create({
            actorId: req.userId, actorName: req.user.name, role: 'superadmin',
            action: 'BROADCAST_MSG', target: `Target: ${target}`, details: { title, count: users.length }
        });

        res.json({ success: true, message: `Sent to ${users.length} users!` });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const seedNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({});
        const users = await userModel.find({}, '_id');
        const notifications = users.map(user => ({
            userId: user._id, title: "Welcome to GreenCart! 🌿", message: "System operational.", type: "system", date: Date.now()
        }));
        await Notification.insertMany(notifications);
        res.json({ success: true, message: "Notifications seeded" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 4. SPECIFIC ROLE LISTS (For Admin Filtering)
// ==========================================
export const getAllRiders = async (req, res) => {
    try {
        const riders = await userModel.find({ role: 'rider' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, riders });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const getAllSellers = async (req, res) => {
    try {
        const sellers = await userModel.find({ role: 'seller' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, sellers });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 👑 5. SUPER ADMIN EXCLUSIVE FUNCTIONS
// ==========================================
export const getSuperAdminStats = async (req, res) => {
    try {
        const totalAdmins = await userModel.countDocuments({ role: 'admin' });
        const totalUsers = await userModel.countDocuments({ role: 'user' });
        const totalRiders = await userModel.countDocuments({ role: 'rider' });
        const totalSellers = await userModel.countDocuments({ role: 'seller' });
        
        const orderStats = await orderModel.aggregate([
            { $match: { payment: true } }, 
            { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalOrders: { $sum: 1 } } }
        ]);
        const totalRevenue = orderStats[0]?.totalRevenue || 0;
        const totalOrders = orderStats[0]?.totalOrders || 0;

        const payoutStats = await Payout.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: "$role", totalPaid: { $sum: "$amount" } } }
        ]);
        
        const sellerPayouts = payoutStats.find(p => p._id === 'seller')?.totalPaid || 0;
        const riderPayouts = payoutStats.find(p => p._id === 'rider')?.totalPaid || 0;
        
        const completedOrders = await orderModel.find({ payment: true });
        const platformProfit = completedOrders.reduce((acc, order) => acc + (order.platformFee || 0), 0);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await orderModel.aggregate([
            { $match: { payment: true, date: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: { $toDate: "$date" } }, year: { $year: { $toDate: "$date" } } },
                revenue: { $sum: "$amount" },
                platformEarnings: { $sum: "$platformFee" },
                count: { $sum: 1 }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedGraphData = monthlyData.map(item => ({
            name: monthNames[item._id.month - 1],
            revenue: item.revenue,
            payout: item.platformEarnings // Graph shows platform cut
        }));

        const recentLogs = await ActivityLog.find().sort({ timestamp: -1 }).limit(10);

        res.json({
            success: true,
            stats: {
                users: { admin: totalAdmins, customer: totalUsers, rider: totalRiders, seller: totalSellers },
                financials: { revenue: totalRevenue, orders: totalOrders },
                earningsSplit: { seller: sellerPayouts, rider: riderPayouts, platform: platformProfit },
                revenueOverTime: formattedGraphData,
                recentLogs
            }
        });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 🟢 CLERK TO MONGODB JUST-IN-TIME SYNC
// ==========================================
export const clerkLoginSync = async (req, res) => {
    try {
        const { clerkId } = req.body;

        if (!clerkId) {
            return res.json({ success: false, message: "No Clerk ID provided." });
        }

        let user = await userModel.findOne({ clerkId }).select("-password");

        // 🟢 JIT (Just-In-Time) Account Creation
        if (!user) {
            console.log("New user detected! Fetching from Clerk and saving to MongoDB...");
            
            const clerkUser = await clerkClient.users.getUser(clerkId);
            const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
            const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "New User";

            user = await userModel.findOne({ email: primaryEmail });
            
            if (user) {
                user.clerkId = clerkId;
                if (!user.name) user.name = fullName;
                if (clerkUser.imageUrl && !user.profileImage) user.profileImage = clerkUser.imageUrl;
                user.isVerified = true;
                await user.save();
            } else {
                const salt = await bcrypt.genSalt(10);
                const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);

                user = new userModel({
                    clerkId: clerkId,
                    name: fullName,
                    email: primaryEmail,
                    password: dummyPassword,
                    profileImage: clerkUser.imageUrl || "",
                    role: "user", 
                    cartItems: {},
                    isVerified: true
                });
                await user.save();
            }
            console.log("User provisioned instantly!");
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

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