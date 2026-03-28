import express from 'express';
import { 
    // Dashboard
    getDashboardStats, 

    // User Management
    getAllUsers, 
    changeUserRole, 
    toggleBlockUser, 
    deleteUser, 
    updateUserDetails,

    // Support 
    getSupportTickets,
    closeTicket,

    // Role Specific Lists 
    getAllRiders,
    getAllSellers
} from '../controllers/adminController.js';

// 🟢 FIXED: Import the payout functions from the correct controller!
import { getPayouts, processPayout } from '../controllers/payoutController.js';

import { protect, authorize } from '../middlewares/authRole.js';

const adminRouter = express.Router();

// ====================================================
// 📊 DASHBOARD ANALYTICS
// ====================================================
adminRouter.get('/stats', protect, authorize('admin', 'superadmin'), getDashboardStats);


// ====================================================
// 💰 PAYOUT MANAGEMENT (Super Admin Only)
// ====================================================
// 🟢 FIXED: Changed 'getAllPayouts' to 'getPayouts' to match the controller
adminRouter.get('/payouts', protect, authorize('superadmin'), getPayouts);
adminRouter.post('/payout-process', protect, authorize('superadmin'), processPayout);


// ====================================================
// 👥 USER MANAGEMENT 
// ====================================================
adminRouter.get('/users', protect, authorize('admin', 'superadmin'), getAllUsers);
adminRouter.post('/change-role', protect, authorize('superadmin'), changeUserRole);
adminRouter.post('/block-user', protect, authorize('admin', 'superadmin'), toggleBlockUser);
adminRouter.post('/delete-user', protect, authorize('superadmin'), deleteUser);
adminRouter.post('/update-user-details', protect, authorize('superadmin'), updateUserDetails);


// ====================================================
// 🎫 SUPPORT TICKETS 
// ====================================================
adminRouter.get('/support-tickets', protect, authorize('admin', 'superadmin'), getSupportTickets);
adminRouter.post('/close-ticket', protect, authorize('admin', 'superadmin'), closeTicket);


// ====================================================
// 📋 ROLE SPECIFIC LISTS 
// ====================================================
adminRouter.get('/riders', protect, authorize('admin', 'superadmin'), getAllRiders);
adminRouter.get('/sellers', protect, authorize('admin', 'superadmin'), getAllSellers);

export default adminRouter;