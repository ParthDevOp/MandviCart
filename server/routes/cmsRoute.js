import express from 'express';
import { getSiteSettings, updateSiteSettings } from '../controllers/cmsController.js';
import { protect, authorize } from '../middlewares/authRole.js';

const cmsRouter = express.Router();

// GET /api/cms/get
cmsRouter.get('/get', getSiteSettings);

// POST /api/cms/update (Super Admin Only)
cmsRouter.post('/update', protect, authorize('superadmin'), updateSiteSettings);

export default cmsRouter;