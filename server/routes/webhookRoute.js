import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';
import crypto from 'crypto'; 

const router = express.Router();

// 🟢 1. TEST ROUTE 
router.get('/clerk', (req, res) => {
    res.send("✅ The Webhook Route is LIVE and reachable through the tunnel!");
});

// 🟢 2. MAIN CLERK WEBHOOK ENDPOINT
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
    
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
        console.error("❌ Error: Missing CLERK_WEBHOOK_SECRET in .env");
        return res.status(500).json({ success: false, message: "Server secret missing" });
    }

    // Get the headers from Svix
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error("❌ Error: Missing Svix headers");
        return res.status(400).json({ success: false, message: "Missing Svix headers" });
    }

    // Get the raw body as a string
    const payload = req.body.toString('utf8');
    const wh = new Webhook(SIGNING_SECRET);
    let evt;

    // Verify the payload
    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error('❌ Webhook Verification Failed:', err.message);
        return res.status(400).json({ success: false, message: "Verification failed" });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`📢 Webhook Handshake Success: ${eventType} for User: ${id}`);

    // ==========================================
    // 👤 HANDLE USER CREATED / UPDATED
    // ==========================================
    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name || ''} ${last_name || ''}`.trim() || 'New User';

        try {
            // 🔍 CHECK: See if this user already exists in MongoDB
            let existingUser = await User.findOne({ email });

            if (existingUser) {
                // 🔄 UPDATE / MERGE: Sync new Clerk data to existing MongoDB profile
                existingUser.clerkId = id;
                existingUser.name = name;
                existingUser.profileImage = image_url || existingUser.profileImage;
                existingUser.isVerified = true;
                await existingUser.save();
                console.log(`🔄 SYNC: User profile updated/merged in MongoDB (${email}).`);
            } else if (eventType === 'user.created') {
                // ✨ CREATE: Brand new customer signup
                await User.create({
                    clerkId: id,
                    name: name,
                    email: email,
                    password: crypto.randomBytes(16).toString('hex'), // Secure Mongoose filler
                    profileImage: image_url,
                    role: 'user', 
                    isVerified: true,
                    cartItems: {}
                });
                console.log(`✅ DATABASE SYNC: New user ${email} saved to MongoDB.`);
            }
        } catch (dbError) {
            console.error("❌ DATABASE ERROR:", dbError.message);
        }
    }

    // ==========================================
    // 🗑️ HANDLE USER DELETED (CLERK -> DB)
    // ==========================================
    if (eventType === 'user.deleted') {
        try {
            await User.findOneAndDelete({ clerkId: id });
            console.log(`🗑️ CLEANUP: User ${id} removed from MongoDB.`);
        } catch (dbError) {
            console.error("❌ DELETE ERROR:", dbError.message);
        }
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
});

export default router;