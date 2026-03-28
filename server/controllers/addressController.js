import Address from "../models/Address.js";

// 1. ADD ADDRESS
export const addAddress = async (req, res) => {
    try {
        const { address } = req.body; 
        const userId = req.userId; 

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        await Address.create({ ...address, userId });
        res.json({ success: true, message: "Address added successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// 2. GET ADDRESSES
export const getAddress = async (req, res) => {
    try {
        const userId = req.userId; 
        const addresses = await Address.find({ userId });
        res.json({ success: true, addresses });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    } 
};

// 3. REMOVE ADDRESS
export const removeAddress = async (req, res) => {
    try {
        const { id } = req.body; 
        if (!id) return res.json({ success: false, message: "Address ID required" });

        await Address.findByIdAndDelete(id);
        res.json({ success: true, message: "Address removed successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// 4. UPDATE ADDRESS (✅ This was missing in your code)
export const updateAddress = async (req, res) => {
    try {
        const { addressId, address } = req.body;
        // Ensure the address belongs to the logged-in user before updating
        await Address.findOneAndUpdate(
            { _id: addressId, userId: req.userId }, 
            address
        );
        res.json({ success: true, message: "Address Updated Successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};