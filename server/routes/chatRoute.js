import express from 'express';
import { protect, authorize } from '../middlewares/authRole.js';
import upload from '../configs/multer.js';
import { 
    userSendMessage, getUserChat, getAllChats, adminReply, 
    toggleChatStatus, startNewChat 
} from '../controllers/chatController.js';

const chatRouter = express.Router();

// User
chatRouter.post('/send', protect, upload.single('image'), userSendMessage);
chatRouter.get('/my-chat', protect, getUserChat);
chatRouter.post('/status', protect, toggleChatStatus); // User closing chat
chatRouter.post('/new', protect, startNewChat);        // User starting new

// Admin
chatRouter.get('/all', protect, authorize('admin', 'superadmin'), getAllChats);
chatRouter.post('/reply', protect, authorize('admin', 'superadmin'), adminReply);
chatRouter.post('/admin-status', protect, authorize('admin', 'superadmin'), toggleChatStatus); // Admin close/reopen

export default chatRouter;