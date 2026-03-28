import express from 'express';
import upload from '../configs/multer.js'; 
import { protect, authorize } from '../middlewares/authRole.js';
import { 
    addProduct, 
    listProducts, 
    removeProduct, 
    singleProduct, 
    updateStock, 
    sellerProducts, 
    updateProduct,
    addProductReview,
    listCategories,
    approveProduct, 
    rejectProduct // 🟢 IMPORTED THE REJECT CONTROLLER
} from '../controllers/productController.js';

const productRouter = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (Anyone can access)
// ==========================================
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProducts);
productRouter.get('/categories', listCategories);

// ==========================================
// 2. PROTECTED USER ROUTES (Must be logged in)
// ==========================================
productRouter.post('/review', protect, addProductReview);

// ==========================================
// 3. SELLER / ADMIN ROUTES
// ==========================================
// 🟢 FIX: Added capitalized roles ('Admin', 'SuperAdmin') to prevent 403 errors
productRouter.get('/seller-list', protect, authorize('seller', 'admin', 'Admin', 'superadmin', 'SuperAdmin'), sellerProducts);
productRouter.post('/add', protect, authorize('seller', 'admin', 'Admin', 'superadmin', 'SuperAdmin'), upload.any(), addProduct);
productRouter.post('/update', protect, authorize('seller', 'admin', 'Admin', 'superadmin', 'SuperAdmin'), upload.any(), updateProduct);
productRouter.post('/remove', protect, authorize('seller', 'admin', 'Admin', 'superadmin', 'SuperAdmin'), removeProduct);
productRouter.post('/stock', protect, authorize('seller', 'admin', 'Admin', 'superadmin', 'SuperAdmin'), updateStock);

// ==========================================
// 🟢 4. ADMIN & SUPERADMIN EXCLUSIVE ROUTES
// ==========================================
// This allows admins to approve/reject seller products so they go live on the site
productRouter.post('/approve', protect, authorize('admin', 'Admin', 'superadmin', 'SuperAdmin'), approveProduct);
productRouter.post('/reject', protect, authorize('admin', 'Admin', 'superadmin', 'SuperAdmin'), rejectProduct); // 🟢 NEW REJECT ROUTE
 
export default productRouter;