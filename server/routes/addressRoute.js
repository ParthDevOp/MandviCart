import express from 'express';
import { addAddress, getAddress, removeAddress, updateAddress } from '../controllers/addressController.js';
import { protect } from '../middlewares/authRole.js'; 

const addressRouter = express.Router();

addressRouter.post('/add', protect, addAddress);
addressRouter.get('/get', protect, getAddress);
addressRouter.post('/remove', protect, removeAddress);

// ✅ NEW ROUTE FOR EDITING
addressRouter.post('/update', protect, updateAddress);

export default addressRouter;