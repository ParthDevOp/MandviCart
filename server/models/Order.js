import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' }, 
    sellerId: { type: String, required: true, ref: 'User' },
    
    items: [{
        product: { type: Object, required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        price: { type: Number },
        finalPrice: { type: Number }
    }],
    
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    
    status: { 
        type: String, 
        default: 'Order Placed', 
        enum: ['Order Placed', 'Packing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'] 
    },
    
    // Financials
    deliveryFee: { type: Number, default: 0 },
    adminCommission: { type: Number, default: 0 },
    sellerEarnings: { type: Number, default: 0 },

    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, default: false },
    
    // Logistics & Assignment
    riderId: { type: String, default: null, ref: 'User' }, 
    droppedByRiders: [{ type: String, ref: 'User' }], // 🟢 Prevents rejected jobs from showing up again
    
    // Security & Verification
    pickupOtp: { type: String }, // 🟢 Verifies Seller to Rider handoff
    otp: { type: String, required: true }, // Verifies Rider to Customer delivery
    riderVerificationImage: { type: String, default: "" }, // 🟢 Stores the FaceID selfie for Admin review
    
    date: { type: Number, default: Date.now },
    deliveredAt: { type: Number }
}, { minimize: false });

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);
export default orderModel;