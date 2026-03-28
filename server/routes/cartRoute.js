import express from 'express';
// 1. IMPORT the new middleware
import { protect } from '../middlewares/authRole.js'; 
import { addToCart, getUserCart, updateCart, removeFromCart } from '../controllers/cartController.js';

const cartRouter = express.Router();

// 2. USE 'protect' instead of 'authRole'
// Cart features usually only need the user to be logged in (protect), 
// they don't usually need specific roles like 'admin'.

cartRouter.post('/add', protect, addToCart);
cartRouter.post('/update', protect, updateCart); // or /get
cartRouter.post('/get', protect, getUserCart);
cartRouter.post('/remove', protect, removeFromCart); // Added just in case you have this

export default cartRouter;