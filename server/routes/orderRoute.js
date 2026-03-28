import express from 'express';
import { protect, authorize } from '../middlewares/authRole.js';
import { 
    placeOrder, 
    placeOrderMock,
    placeOrderStripe, 
    verifyOrder,
    allOrders, 
    userOrders, 
    sellerOrders, 
    updateStatus, 
    cancelOrder
} from '../controllers/orderController.js';

const orderRouter = express.Router();

// ==========================================
// 🛒 CUSTOMER ROUTES (Requires Login)
// ==========================================

// Placing Orders
orderRouter.post('/place', protect, placeOrder);         // COD (Cash on Delivery)
orderRouter.post('/mock', protect, placeOrderMock);      // Online (Mock Payment)
orderRouter.post('/stripe', protect, placeOrderStripe);  // Stripe (Disabled Stub)
orderRouter.post('/verify', protect, verifyOrder);       // Verify (Disabled Stub)

// Order Management
orderRouter.get('/user', protect, userOrders);           // Get Customer's Personal Orders
orderRouter.post('/cancel', protect, cancelOrder);       // Customer Cancels their Order

// ==========================================
// 🛡️ ADMIN ROUTES (Requires Admin/SuperAdmin)
// ==========================================
// 🟢 Displays all orders across the entire platform
orderRouter.get('/all-list', protect, authorize('admin', 'superadmin'), allOrders); 

// ==========================================
// 🏪 SELLER ROUTES (Requires Seller)
// ==========================================
// 🟢 Displays only the orders assigned to the logged-in Seller
orderRouter.get('/seller', protect, authorize('seller', 'admin', 'superadmin'), sellerOrders);

// ==========================================
// 🔄 SHARED OPERATIONS (Multi-Role Access)
// ==========================================
// 🟢 Update Status: Used by Admin (Manual Override), Seller (Packing -> Ready), and Rider (Pickup Verification)
orderRouter.post('/status', protect, authorize('admin', 'superadmin', 'seller', 'rider'), updateStatus);

export default orderRouter;