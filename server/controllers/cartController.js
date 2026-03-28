import userModel from "../models/User.js";

// 1. ADD TO CART
export const addToCart = async (req, res) => {
    try {
        const userId = req.userId; 
        const { itemId, size } = req.body;

        const userData = await userModel.findById(userId);
        
        // 🟢 FIX: Deep copy ensures Mongoose correctly detects nested changes
        let cartData = userData.cartItems ? JSON.parse(JSON.stringify(userData.cartItems)) : {};

        if (!cartData[itemId]) {
            cartData[itemId] = {};
        }
        
        const itemSize = size || "Standard";

        if (cartData[itemId][itemSize]) {
            cartData[itemId][itemSize] += 1;
        } else {
            cartData[itemId][itemSize] = 1;
        }

        userData.cartItems = cartData;
        userData.markModified('cartItems'); 
        await userData.save();
        
        res.json({ success: true, message: "Added To Cart" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding to cart" });
    }
}

// 2. UPDATE CART
export const updateCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId, size, quantity } = req.body; 

        const userData = await userModel.findById(userId);
        
        // 🟢 FIX: Deep Copy
        let cartData = userData.cartItems ? JSON.parse(JSON.stringify(userData.cartItems)) : {};

        if (cartData[itemId]) {
             cartData[itemId][size] = quantity;
             
             if (quantity <= 0) {
                 delete cartData[itemId][size];
                 if (Object.keys(cartData[itemId]).length === 0) {
                     delete cartData[itemId];
                 }
             }
        }

        userData.cartItems = cartData;
        userData.markModified('cartItems'); 
        await userData.save();

        res.json({ success: true, message: "Cart Updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating cart" });
    }
}

// 3. GET USER CART
export const getUserCart = async (req, res) => {
    try {
        const userId = req.userId;
        const userData = await userModel.findById(userId);
        // Return empty object if undefined
        const cartData = userData.cartItems || {}; 
        
        res.json({ success: true, cartData });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching cart" });
    }
}

// 4. REMOVE FROM CART
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.body;

        const userData = await userModel.findById(userId);
        
        // 🟢 FIX: Deep Copy
        let cartData = userData.cartItems ? JSON.parse(JSON.stringify(userData.cartItems)) : {};

        if (cartData[itemId]) {
            delete cartData[itemId];
        }

        userData.cartItems = cartData;
        userData.markModified('cartItems'); 
        await userData.save();

        res.json({ success: true, message: "Removed From Cart" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error removing from cart" });
    }
}