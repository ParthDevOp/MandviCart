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
    
    // ==========================================
    // 💰 FINANCIALS (Airtight Ledger)
    // ==========================================
    platformFee: { type: Number, default: 0 },       // Net profit for the platform
    deliveryFee: { type: Number, default: 0 },       // Amount collected from customer
    adminCommission: { type: Number, default: 0 },   // Gross commission taken from seller
    sellerEarnings: { type: Number, default: 0 },    // Exact amount owed to Seller
    riderEarnings: { type: Number, default: 0 },     // REQUIRED for Rider Wallet

    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, default: false },
    
    // ==========================================
    // 🚚 LOGISTICS & TRACKING
    // ==========================================
    riderId: { type: String, default: null, ref: 'User' }, 
    droppedByRiders: [{ type: String }], // Hides dropped jobs from riders
    
    pickupCoordinates: { 
        lat: { type: Number }, 
        lng: { type: Number } 
    },
    dropoffCoordinates: { 
        lat: { type: Number }, 
        lng: { type: Number } 
    },
    
    // ==========================================
    // 🔐 SECURITY (2-Step Verification & AI)
    // ==========================================
    pickupOtp: { type: String, required: true }, // Seller -> Rider handoff
    otp: { type: String, required: true },       // Rider -> Customer handoff
    riderVerificationImage: { type: String, default: "" }, // 🟢 Stores the FaceID selfie for Admin review
    riderMatchScore: { type: Number }, // 🟢 Stores Face-API Match Confidence Score
    
    // ==========================================
    // ⏱️ TIMESTAMPS (Drives the Map Animation)
    // ==========================================
    date: { type: Number, default: Date.now },
    acceptedAt: { type: Number },       // Phase 1: When Rider clicks "Accept"
    pickedUpAt: { type: Number },       // Phase 2: When Rider enters pickup OTP
    deliveredAt: { type: Number },      // Phase 3: Delivery complete
    cancelledAt: { type: Number }
}, { minimize: false });

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);
export default orderModel;