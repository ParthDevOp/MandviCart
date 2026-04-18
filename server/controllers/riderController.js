import orderModel from "../models/orderModel.js"; 
import User from "../models/User.js";   
import { v2 as cloudinary } from "cloudinary"; // 🟢 Required for HD Selfie Uploads

// 🟢 1. Toggle Rider Online/Offline Status
export const toggleRiderStatus = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const userId = req.userId; 
        
        const rider = await User.findByIdAndUpdate(
            userId, 
            { isOnline: isOnline }, 
            { new: true }
        );

        if (!rider) return res.json({ success: false, message: "Rider not found" });

        res.json({ 
            success: true, 
            message: `Shift ${isOnline ? 'Started' : 'Ended'} successfully.`,
            isOnline: rider.isOnline
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// 🟢 2. Fetch Available Jobs (Hides jobs this rider dropped)
export const getAvailableJobs = async (req, res) => {
    try {
        const userId = req.userId; 

        const rider = await User.findById(userId);
        if (!rider?.isOnline) {
            return res.json({ success: false, message: "You are offline. Start shift to see jobs." });
        }

        // 🟢 UPGRADED: Only show jobs ready for pickup, without a rider, and NOT dropped by this specific rider
        const orders = await orderModel.find({ 
            status: 'Ready for Pickup',
            riderId: null,
            droppedByRiders: { $ne: userId } // The Magic Filter
        }).sort({ date: 1 });

        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 🟢 3. Accept a Job (Uploads HD Selfie & Assigns Rider)
export const acceptJob = async (req, res) => {
    try {
        const { orderId, verificationImage, riderMatchScore } = req.body; // Extract the HD selfie from frontend
        const userId = req.userId; 

        const order = await orderModel.findById(orderId);
        if (!order) return res.json({ success: false, message: "Order not found" });
        
        if (order.riderId) return res.json({ success: false, message: "Job already taken by another rider" });

        let imageUrl = "";

        // ==========================================
        // 🟢 DIAGNOSTIC LOGGING START
        // ==========================================
        console.log("\n📸 --- RIDER ACCEPT JOB INITIATED ---");
        console.log(`Rider ID: ${userId} | Order ID: ${orderId}`);
        
        if (verificationImage) {
            console.log(`✅ Frontend sent the Base64 image. Uploading to Cloudinary (Match Score: ${riderMatchScore}%)...`);
            try {
                const uploadResponse = await cloudinary.uploader.upload(verificationImage, {
                    folder: "rider_verifications", 
                });
                imageUrl = uploadResponse.secure_url;
                console.log("✅ Cloudinary Upload SUCCESS! URL generated.");
            } catch (uploadError) {
                console.error("❌ CLOUDINARY UPLOAD FAILED:", uploadError.message);
                // We log the error but don't crash, so the rider can still deliver the food.
            }
        } else {
            console.log("⚠️ WARNING: 'verificationImage' is EMPTY or undefined! The frontend did not send a photo.");
        }
        console.log("--------------------------------------\n");
        // ==========================================

        order.riderId = userId;
        order.status = "Ready for Pickup"; 
        order.acceptedAt = Date.now();     
        order.riderVerificationImage = imageUrl; // 🟢 Saves the link for the Admin Panel
        if (riderMatchScore) {
            order.riderMatchScore = riderMatchScore;
        }
        
        await order.save();

        res.json({ success: true, message: "Identity verified and Job accepted!" });
    } catch (error) {
        console.error("Accept Job Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🟢 4. Drop a Job (Emergency Unassign)
export const dropJob = async (req, res) => {
    try {
        const { orderId } = req.body;
        const riderId = req.userId;

        const order = await orderModel.findById(orderId);
        if (!order) return res.json({ success: false, message: "Order not found" });

        // Unassign and reset
        order.riderId = null;
        order.status = 'Ready for Pickup';
        order.acceptedAt = undefined;
        order.riderVerificationImage = ""; // Clear verification so next rider can upload theirs

        // Add to blacklist array so it doesn't show up on their phone again
        if (!order.droppedByRiders.includes(riderId)) {
            order.droppedByRiders.push(riderId);
        }

        await order.save();

        res.json({ success: true, message: "Job dropped and returned to pool." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 🟢 5. Get My Active/Past Jobs
export const getMyJobs = async (req, res) => {
    try {
        const userId = req.userId; 
        const orders = await orderModel.find({ riderId: userId }).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 🟢 6. Complete Delivery 
export const completeDelivery = async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        const userId = req.userId; 

        const order = await orderModel.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        
        if (order.riderId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        if (order.otp && order.otp.toString() !== otp.toString()) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Ask customer again." });
        }

        order.status = "Delivered";
        order.deliveredAt = Date.now(); 
        
        if (order.paymentMethod === 'COD') {
            order.payment = true; 
        }
        
        await order.save();

        res.json({ success: true, message: "Delivery completed! Wallet updated." });
    } catch (error) {
        console.error("Complete Delivery Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};