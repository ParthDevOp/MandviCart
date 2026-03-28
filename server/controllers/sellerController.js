import Order from "../models/orderModel.js";
import User from "../models/User.js";

// 1. GET SELLER PROFILE
export const getSellerProfile = async (req, res) => {
    try {
        const seller = await User.findById(req.userId).select('-password');
        res.json({ success: true, seller });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 2. GET ORDERS SPECIFIC TO THIS SELLER
export const getSellerOrders = async (req, res) => {
    try {
        let orders = await Order.find({ sellerId: req.userId })
            .populate('riderId', 'name phone profileImage vehicleNumber')
            .sort({ date: -1 });
            
        // 🟢 SMART FALLBACK: If this is an old test order missing a pickupOtp, give it "1234"
        const patchedOrders = orders.map(order => {
            const orderObj = order.toObject();
            if (!orderObj.pickupOtp) {
                orderObj.pickupOtp = "1234"; // Default for old test data
            }
            return orderObj;
        });

        res.json({ success: true, orders: patchedOrders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. UPDATE ORDER STATUS (Strict Security Guards Applied)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        const order = await Order.findOne({ _id: orderId, sellerId: req.userId });
        if(!order) return res.json({ success: false, message: "Order not found or not yours." });

        if (order.status === "Out for Delivery" || order.status === "Delivered") {
           return res.json({ success: false, message: "Order has already been handed off to the Valet. You cannot edit it." });
        }

        const allowedSellerStatuses = ["Order Placed", "Packing", "Ready for Pickup"];
        if (!allowedSellerStatuses.includes(status)) {
           return res.json({ success: false, message: "Unauthorized. Only Riders can mark an order as Delivered." });
        }

        order.status = status;
        await order.save();
        
        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const updateSellerProfile = async (req, res) => {
    res.json({ success: true, message: "Feature coming soon" }); 
};