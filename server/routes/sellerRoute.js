import express from 'express';
import { 
    getSellerProfile, 
    updateSellerProfile, 
    getSellerOrders, 
    updateOrderStatus 
} from '../controllers/sellerController.js';

// 👇 IMPORT the correct new middleware
import { protect, authorize } from '../middlewares/authRole.js';

const sellerRouter = express.Router();

// 1. Get Seller Profile
sellerRouter.get('/profile', protect, authorize('seller'), getSellerProfile);

// 2. Update Profile
sellerRouter.post('/update-profile', protect, authorize('seller'), updateSellerProfile);

// 3. Get Orders (Specific to this seller)
sellerRouter.get('/orders', protect, authorize('seller'), getSellerOrders);

// 4. Update Order Status (Seller can mark as Ready, etc.)
sellerRouter.post('/update-status', protect, authorize('seller'), updateOrderStatus);

export default sellerRouter;