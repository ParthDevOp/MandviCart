import express from 'express';
import { 
    // Hero Slider
    addBanner, 
    getBanners, 
    deleteBanner, 
    seedBanners,

    // Flash Sale
    seedFlashSale, 
    getFlashSale,
    updateFlashSale, 

    // Feature Banner
    seedFeaturedBanner, 
    getFeaturedBanner,
    updateFeatureBanner,

    // 🟢 NEW IMPORT: Unified Update for Super Admin
    updateContent 
} from '../controllers/contentController.js';

import upload from '../configs/multer.js';
import { protect, authorize } from '../middlewares/authRole.js';

const contentRouter = express.Router();

// ==========================================
// 1. HERO SLIDER ROUTES
// ==========================================
contentRouter.get('/banners', getBanners); // Public
contentRouter.get('/seed', seedBanners);   // Dev/Reset Tool

// Admin Only: Add & Delete Slides
contentRouter.post('/add-banner', protect, authorize('admin', 'superadmin'), upload.single('image'), addBanner);
contentRouter.post('/delete-banner', protect, authorize('admin', 'superadmin'), deleteBanner);

// ==========================================
// 2. FLASH SALE ROUTES
// ==========================================
contentRouter.get('/flash-sale', getFlashSale);       // Public
contentRouter.get('/seed-flash-sale', seedFlashSale); // Dev/Reset Tool

// Admin Only: Custom Update
contentRouter.post('/update-flash-sale', protect, authorize('admin', 'superadmin'), updateFlashSale);

// ==========================================
// 3. FEATURE BANNER ROUTES
// ==========================================
contentRouter.get('/feature-banner', getFeaturedBanner);       // Public
contentRouter.get('/seed-feature-banner', seedFeaturedBanner); // Dev/Reset Tool

// Admin Only: Custom Update
contentRouter.post('/update-feature', protect, authorize('admin', 'superadmin'), updateFeatureBanner);

// ==========================================
// 🟢 4. SUPER ADMIN CONTENT MANAGER (UNIFIED)
// ==========================================
// This route powers the new "Content Manager" page
contentRouter.post('/update', protect, authorize('superadmin'), updateContent);

export default contentRouter;