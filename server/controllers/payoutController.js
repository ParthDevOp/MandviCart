import Payout from "../models/Payout.js";
import User from "../models/User.js";
import Order from "../models/orderModel.js"; 

// 1. Get Payouts (Filter by status - FOR ADMINS)
export const getPayouts = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        // 🟢 Includes upiId and bankAccount so the Admin can see where to send the money!
        const payouts = await Payout.find(query).populate('userId', 'name email role shopName vehicleNumber upiId bankAccount').sort({ requestDate: -1 });
        res.json({ success: true, payouts });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// 2. Process Payout (Admin Only: Approve/Reject)
export const processPayout = async (req, res) => {
    try {
        const { payoutId, status, transactionId } = req.body; 
        
        const payout = await Payout.findById(payoutId);
        if (!payout) return res.json({ success: false, message: "Payout not found" });

        if (payout.status !== 'pending') {
            return res.json({ success: false, message: "This request was already processed." });
        }

        const user = await User.findById(payout.userId);

        if (status === 'paid') {
            user.pendingWithdrawals = (user.pendingWithdrawals || 0) - payout.amount;
            user.totalWithdrawn = (user.totalWithdrawn || 0) + payout.amount;
            
            payout.status = 'paid';
            payout.paidDate = Date.now();
            payout.transactionId = transactionId || 'MANUAL-' + Date.now();
        } 
        else if (status === 'rejected') {
            user.pendingWithdrawals = (user.pendingWithdrawals || 0) - payout.amount;
            payout.status = 'rejected';
        }

        await user.save();
        await payout.save();

        res.json({ success: true, message: `Payout successfully marked as ${status}` });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// 3. Request Payout (For Seller/Rider)
export const requestPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.userId);

        if (!user) return res.json({ success: false, message: "User not found" });

        let totalEarnings = 0;
        if (user.role === 'seller') {
            const orders = await Order.find({ sellerId: req.userId, status: 'Delivered' });
            totalEarnings = orders.reduce((sum, order) => sum + (order.sellerEarnings || 0), 0);
        } else if (user.role === 'rider') {
            const orders = await Order.find({ riderId: req.userId, status: 'Delivered' });
            totalEarnings = orders.reduce((sum, order) => sum + (order.riderEarnings || order.deliveryFee || 40), 0);
        }

        const pending = user.pendingWithdrawals || 0;
        const withdrawn = user.totalWithdrawn || 0;
        const availableBalance = totalEarnings - pending - withdrawn;

        if (amount > availableBalance) {
            return res.json({ success: false, message: "Insufficient available balance. You may have pending requests." });
        }

        user.pendingWithdrawals = pending + amount;
        await user.save();

        const newPayout = new Payout({
            userId: req.userId,
            role: user.role,
            amount
        });
        await newPayout.save();

        res.json({ success: true, message: "Payout requested successfully!" });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// ==========================================
// 🟢 4. NEW: Get User's Own Payout History 
// ==========================================
// This allows the Rider or Seller to see their own Pending, Paid, and Rejected history!
export const getUserPayouts = async (req, res) => {
    try {
        // Find all payouts that belong to the logged-in user, newest first
        const payouts = await Payout.find({ userId: req.userId }).sort({ requestDate: -1 });
        res.json({ success: true, payouts });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};