import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Order from "../models/orderModel.js";
import { v2 as cloudinary } from "cloudinary";

// ==========================================
// 🤖 HELPER: INTELLIGENT BOT RESPONSE
// ==========================================
const getBotResponse = async (userId, text, hasImage) => {
    const lowerText = text ? text.toLowerCase() : "";
    const user = await User.findById(userId);
    
    // 🟢 Safe fallback just in case user data is incomplete
    const userName = user?.name || 'Valued Customer'; 
    
    let response = { text: "", quickReplies: [] };

    // 1. 📸 IMAGE RECEIVED (Proof of Faulty Item -> Admin Takeover)
    if (hasImage) {
        response.text = "🤖 **Evidence Received.** 📸\nThank you for providing a photo of the faulty item. I have attached this securely to your case file.\n\n🔄 **Transferring to Live Agent...**\nPlease hold for a moment. A human admin is now reviewing your image and will process your direct refund or replacement right away.";
        return response; // No quick replies, forces them to wait for the Admin
    }

    // 2. 👋 GREETINGS
    if (['hi', 'hii', 'hello', 'hey', 'start', 'greetings'].some(w => lowerText.includes(w))) {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

        response.text = `🤖 **${greeting}, ${userName}!** \nWelcome to Mandvi Cart Priority Support. I am your virtual assistant. \n\nHow may I assist you today?`;
        response.quickReplies = ["📦 Track My Order", "💔 Report Faulty Item", "💳 Refund Policy", "👤 Speak to an Agent"];
        return response;
    }

    // 3. 📦 ORDER STATUS
    if (['order', 'track', 'status', 'where'].some(w => lowerText.includes(w))) {
        const lastOrder = await Order.findOne({ userId }).sort({ date: -1 });
        
        if (!lastOrder) {
            response.text = "🤖 I have checked our records, but I am unable to locate any recent orders associated with this account. \n\nWould you like to speak with an agent?";
            response.quickReplies = ["👤 Speak to an Agent", "🔙 Main Menu"];
        } else {
            const date = new Date(lastOrder.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            
            response.text = `🤖 **Order Status Update** \n\n**Order ID:** #${lastOrder._id.slice(-6).toUpperCase()}\n**Date Placed:** ${date}\n**Current Status:** ${lastOrder.status}\n**Payment:** ${lastOrder.payment ? '✅ Paid' : '⏳ Pending'}`;
            response.quickReplies = ["💔 Report Issue", "✅ All Good, Thanks"];
        }
        return response;
    }

    // 4. 💔 FAULTY / DAMAGED ITEM (The Hook)
    if (['faulty', 'damage', 'broken', 'defect', 'spoiled', 'rotten', 'bad', 'issue'].some(w => lowerText.includes(w))) {
        response.text = "🤖 I am so sorry to hear that your item arrived in that condition!\n\nTo help us process a **direct refund** or replacement for you immediately, please tap the 📷 **Camera Icon** below and upload a clear picture of the faulty item.";
        return response;
    }

    // 5. 💳 REFUND INQUIRY
    if (['refund', 'return', 'money'].some(w => lowerText.includes(w))) {
        response.text = "🤖 **Refunds for Faulty Items**\n\nIf you received a damaged or faulty item, we will refund you directly! Just upload a photo of the item using the 📷 **Camera Icon** below, and an admin will issue your refund to your original payment method.";
        response.quickReplies = ["👤 Speak to an Agent", "🔙 Main Menu"];
        return response;
    }

    // 6. 👤 AGENT REQUEST
    if (['agent', 'human', 'support', 'person'].some(w => lowerText.includes(w))) {
        response.text = "🤖 I am transferring your chat to our specialized support team. A human agent will take over this conversation shortly.";
        return response;
    }

    // 7. ✅ CLOSING
    if (['thank', 'ok', 'bye', 'good'].some(w => lowerText.includes(w))) {
        response.text = "🤖 You are very welcome! It was a pleasure assisting you.\n\nThank you for choosing Mandvi Cart. Have a wonderful day! 🌿";
        return response;
    }

    // Default fallback if bot doesn't understand
    return null;
};

// ==========================================
// 1. USER: SEND MESSAGE
// ==========================================
export const userSendMessage = async (req, res) => {
    try {
        const text = req.body?.text || ""; 
        const userId = req.userId;
        const imageFile = req.file; 

        let chat = await Chat.findOne({ userId });

        if (!chat) {
            chat = new Chat({ userId, messages: [] });
        }

        // 🟢 THE FIX: Auto-Archive Closed Chats!
        // If the ticket was closed, but the user sends a new message (or clicks "Report Issue"),
        // we automatically archive the old chat and start a fresh active ticket for them.
        if (chat.status === 'closed') {
            if (chat.messages.length > 0) {
                chat.archived.push({
                    messages: chat.messages,
                    closedAt: Date.now()
                });
            }
            chat.messages = []; // Clear the board for the new issue
            chat.status = 'active'; // Reopen the ticket
        }

        let imageUrl = null;
        let messageText = text;

        if (imageFile) {
            const uploadRes = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            imageUrl = uploadRes.secure_url;
            messageText = text || "Sent an attachment";
        }

        if (!messageText && !imageUrl) {
            return res.json({ success: false, message: "Cannot send an empty message." });
        }

        chat.messages.push({ 
            sender: 'user', 
            text: messageText,
            image: imageUrl 
        });
        
        // Mark as unread by admin so it lights up on the Admin Dashboard
        chat.lastUpdated = Date.now();
        chat.isReadByAdmin = false;
        chat.isReadByUser = true;

        const botReply = await getBotResponse(userId, messageText, !!imageUrl);

        if (botReply) {
            chat.messages.push({ 
                sender: 'admin', 
                text: botReply.text,
                quickReplies: botReply.quickReplies,
                createdAt: Date.now() + 100 
            });
            chat.isReadByUser = false; 
        }

        await chat.save();
        res.json({ success: true, chat });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. TOGGLE STATUS (Close / Reopen)
// ==========================================
export const toggleChatStatus = async (req, res) => {
    try {
        const { userId, status } = req.body; 
        const targetId = userId || req.userId; 

        const chat = await Chat.findOne({ userId: targetId });
        if (!chat) return res.json({ success: false, message: "Chat not found" });

        chat.status = status;

        chat.messages.push({
            sender: 'admin',
            text: status === 'closed' ? "🔒 **This ticket has been closed.**" : "🔓 **This ticket has been reopened.**",
            createdAt: Date.now()
        });

        await chat.save();
        res.json({ success: true, chat });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. START NEW CHAT (Archive Old)
// ==========================================
export const startNewChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({ userId: req.userId });
        
        if (!chat) return res.json({ success: false, message: "No history to archive" });

        if (chat.messages.length > 0) {
            chat.archived.push({
                messages: chat.messages,
                closedAt: Date.now()
            });
        }

        chat.messages = [];
        chat.status = 'active';
        chat.messages.push({ 
            sender: 'admin', 
            text: "🤖 **New Conversation Started.** \nHow can we help you today?", 
            createdAt: Date.now() 
        });
        
        await chat.save();
        res.json({ success: true, chat });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. GETTERS (User & Admin)
// ==========================================
export const getUserChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({ userId: req.userId });
        if(chat) {
            chat.isReadByUser = true;
            await chat.save();
        }
        res.json({ success: true, chat: chat || { messages: [] } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getAllChats = async (req, res) => {
    try {
        const chats = await Chat.find({})
            .populate('userId', 'name email role')
            .sort({ lastUpdated: -1 });
        res.json({ success: true, chats });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ==========================================
// 5. ADMIN REPLY
// ==========================================
export const adminReply = async (req, res) => {
    try {
        const { userId, text } = req.body;
        
        const chat = await Chat.findOne({ userId });
        if (!chat) return res.json({ success: false, message: "Chat not found" });

        if (chat.status === 'closed') {
            return res.json({ success: false, message: "Ticket is closed. Please reopen it to reply." });
        }

        chat.messages.push({ 
            sender: 'admin', 
            text,
            adminId: req.userId 
        });
        
        chat.lastUpdated = Date.now();
        chat.isReadByAdmin = true;
        chat.isReadByUser = false; 

        await chat.save();
        res.json({ success: true, message: "Reply Sent" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};