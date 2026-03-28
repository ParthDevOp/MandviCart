import express from 'express';
import { 
    login, 
    register, 
    logout, 
    createAccount, 
    deleteUser, 
    getAllUsers, 
    isAuth, 
    subscribeToNewsletter, 
    getUserNotifications, 
    updateUserProfile, 
    seedNotifications, 
    submitQuery, 
    getSuperAdminStats,
    getSystemSettings,
    updateSystemSettings,
    getActivityLogs,
    sendAnnouncement,
    clerkLoginSync,
    
    // 🟢 FIXED IMPORTS: These exactly match the names in your userController.js now
    getUserDeepInfo,     
    changeUserRole,      
    adminToggleBlock,    // Changed from toggleBlockUser
    adminUpdateUser      // Changed from updateUserDetails
} from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/authRole.js';
import upload from '../configs/multer.js'; 

const userRouter = express.Router();

// ==========================================
// 🟢 CLERK AUTHENTICATION HAND-OFF
// ==========================================
userRouter.post('/clerk-login', clerkLoginSync); 

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================
userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/logout', logout);
userRouter.post('/newsletter', subscribeToNewsletter);
userRouter.post('/contact', submitQuery);

// ==========================================
// 🔒 USER PROTECTED ROUTES
// ==========================================
userRouter.get('/is-auth', protect, isAuth);
userRouter.get('/notifications', protect, getUserNotifications);
userRouter.post('/update-profile', protect, upload.single('image'), updateUserProfile);

// ==========================================
// 🛡️ ADMIN MANAGEMENT ROUTES
// ==========================================
userRouter.get('/admin/stats', protect, authorize('admin', 'superadmin'), getSuperAdminStats); 
userRouter.get('/admin/users', protect, authorize('admin', 'superadmin'), getAllUsers);

userRouter.post('/admin/deep-view', protect, authorize('admin', 'superadmin'), getUserDeepInfo);

userRouter.post('/admin/add', protect, authorize('admin', 'superadmin'), createAccount);

// 🟢 SMART ROUTER: Automatically calls the correct function based on what the frontend is sending
userRouter.post('/admin/update', protect, authorize('admin', 'superadmin'), (req, res) => {
    if (req.body.role) {
        return changeUserRole(req, res);
    }
    return adminUpdateUser(req, res);
});

// 🟢 FIXED: Points to adminToggleBlock
userRouter.post('/admin/block', protect, authorize('admin', 'superadmin'), adminToggleBlock);

userRouter.post('/admin/delete', protect, authorize('superadmin'), deleteUser); 

// ==========================================
// 👑 SUPER ADMIN EXCLUSIVE ROUTES
// ==========================================
userRouter.get('/super/stats', protect, authorize('superadmin'), getSuperAdminStats);
userRouter.get('/super/logs', protect, authorize('superadmin'), getActivityLogs);
userRouter.get('/super/settings', protect, authorize('superadmin'), getSystemSettings);
userRouter.post('/super/settings', protect, authorize('superadmin'), updateSystemSettings);
userRouter.post('/super/announce', protect, authorize('superadmin'), sendAnnouncement);

// Utils
userRouter.get('/seed-notifications', seedNotifications);

export default userRouter;