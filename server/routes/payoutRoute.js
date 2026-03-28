import express from 'express';
import { protect, authorize } from '../middlewares/authRole.js';
import { getPayouts, processPayout, requestPayout, getUserPayouts } from '../controllers/payoutController.js';

const payoutRouter = express.Router();

// 🛡️ Super Admin / Admin Routes
payoutRouter.get('/list', protect, authorize('admin', 'superadmin'), getPayouts);
payoutRouter.post('/process', protect, authorize('superadmin'), processPayout); 

// 🛵 Seller / Rider Routes
payoutRouter.post('/request', protect, authorize('seller', 'rider'), requestPayout);

// 🟢 NEW: Route for Sellers/Riders to fetch their personal history!
payoutRouter.get('/user', protect, authorize('seller', 'rider'), getUserPayouts);

export default payoutRouter;