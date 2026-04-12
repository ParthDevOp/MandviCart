import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Order from "../models/orderModel.js";
import { v2 as cloudinary } from "cloudinary";

// ==========================================
// 🤖 HELPER: INTELLIGENT BOT RESPONSE (AURA)
// ==========================================
const getBotResponse = async (userId, text, hasImage) => {
    const lowerText = text ? text.toLowerCase() : "";
    const user = await User.findById(userId);
    
    // 🟢 Safe fallback
    const userName = user?.name ? user.name.split(' ')[0] : 'Valued Guest'; 
    
    let response = { text: "", quickReplies: [] };

    // 1. 📸 IMAGE RECEIVED (Proof of Faulty Item -> Admin Takeover)
    if (hasImage) {
        response.text = "✨ **Visual Data Analyzed.** 📸\nThank you for providing photographic evidence. I have securely attached this to your case file.\n\n🔄 **Engaging Human Protocol...**\nPlease hold. I am directly routing this visual proof to our Senior Support Team for immediate review. Your refund or replacement is our top priority.";
        return response; // No quick replies, forces them to wait for the Admin
    }

    // 2. 👋 MAIN MENU / GREETINGS
    if (['hi', 'hii', 'hello', 'hey', 'start', 'greetings', 'menu', 'back', 'main menu'].some(w => lowerText.includes(w))) {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

        response.text = `✨ **${greeting}, ${userName}.** I am **Aura**, your Advanced Support Intelligence.\n\nMy neural network is fully synchronized with the MandviCart ecosystem. How may I accelerate your experience today?`;
        response.quickReplies = ["📦 Track Order", "🚚 Delivery Delay", "💔 Report Issue", "💳 Refund Policy", "🔒 Account Help", "👤 Real Human"];
        return response;
    }

    // 3. 📦 EXACT ORDER TRACKING
    if (['order', 'track', 'status', 'where', 'missing'].some(w => lowerText.includes(w))) {
        const lastOrder = await Order.findOne({ userId }).sort({ date: -1 });
        
        if (!lastOrder) {
            response.text = "✨ **Database Scanning...**\nI've analyzed our logs, but no recent orders are associated with your verified profile. \n\nAre you looking for a tracking update on an older order or a different account?";
            response.quickReplies = ["👤 Connect to Admin", "🔙 Main Menu"];
        } else {
            const date = new Date(lastOrder.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            
            response.text = `✨ **Real-Time Order Telemetry** \n\n**Order ID:** \`#${lastOrder._id.slice(-8).toUpperCase()}\`\n**Timestamp:** ${date}\n**Current Status:** \`${lastOrder.status.toUpperCase()}\`\n**Financial Status:** ${lastOrder.payment ? '✅ SECURED' : '⏳ PENDING VERIFICATION'}\n\nOur system predicts this delivery is proceeding optimally.`;
            response.quickReplies = ["🚚 It's Delayed", "💔 Report Issue", "🔙 Main Menu"];
        }
        return response;
    }

    // 4. 🚚 DELIVERY DELAY LOGIC
    if (['delay', 'late', 'rider', 'slow'].some(w => lowerText.includes(w))) {
        response.text = "✨ **Logistics Analysis Initiated.**\nI apologize if our delivery telemetry indicates a delay. Depending on local traffic density and vendor processing, minor anomalies can occur.\n\nWould you like me to ping the assigned Rider's GPS directly or escalate this to logistical command?";
        response.quickReplies = ["📡 Ping Rider", "👤 Escalate to Courier Admin", "🔙 Main Menu"];
        return response;
    }

    // Ping Rider Simulator
    if (['ping', 'gps'].some(w => lowerText.includes(w))) {
        response.text = "📡 **Pinging Rider Node...**\nSignal received. The associated fulfillment rider is en-route. Please monitor the Live Map interface for real-time topographical updates.";
        response.quickReplies = ["✅ Excellent", "🔙 Main Menu"];
        return response;
    }

    // 5. 💔 FAULTY / DAMAGED ITEM (The Hook)
    if (['faulty', 'damage', 'broken', 'defect', 'spoiled', 'rotten', 'bad', 'issue'].some(w => lowerText.includes(w))) {
        response.text = "✨ **Quality Assurance Protocol Activated.**\nI am deeply sorry that an item in your payload did not meet our high synchronization standards.\n\nTo trigger an automated rapid-refund, please tap the 📷 **Camera Icon** below and send a visual scan (photo) of the defective asset.";
        return response;
    }

    // 6. 💳 REFUND INQUIRY
    if (['refund', 'return', 'money', 'cancel'].some(w => lowerText.includes(w))) {
        response.text = "✨ **Financial Operations Database.**\n\n• **Faulty Goods:** Full rapid reimbursement upon visual scan upload (📷).\n• **Cancellations:** Automatic balance restoration to original payment method within 24-48 business hours.\n\nWould you like me to initiate a financial dispute trace with a human auditor?";
        response.quickReplies = ["👤 Open Dispute", "🔙 Main Menu"];
        return response;
    }

    // 7. 🔒 ACCOUNT & SECURITY
    if (['account', 'password', 'login', 'security', 'hack'].some(w => lowerText.includes(w))) {
        response.text = "✨ **Security & Identity Management.**\nYour MandviCart profile is encrypted via enterprise-grade systems.\n\nIf you simply need to reset credentials, log out and click 'Forgot Password'. If you suspect a breach, I can lock your account and patch you through to Cyber Security Response.";
        response.quickReplies = ["👤 Security Admin", "🔙 Main Menu"];
        return response;
    }

    // 8. 👤 AGENT REQUEST
    if (['agent', 'human', 'support', 'person', 'supervisor', 'admin', 'dispute'].some(w => lowerText.includes(w))) {
        response.text = "✨ **Transferring to Carbon-Based Support Unit...**\nI am passing your encrypted session profile to a human specialist. They will assume manual control of this channel shortly.";
        return response; // No replies, wait for admin
    }

    // 9. ✅ CLOSING
    if (['thank', 'ok', 'bye', 'good', 'excellent', 'perfect'].some(w => lowerText.includes(w))) {
        response.text = "✨ **Session Complete.**\nIt was a privilege processing your request, " + userName + ".\n\nMandviCart Intelligence signing off. Have a highly productive cycle! 🌌";
        return response;
    }

    // 10. Default Fallback
    response.text = "✨ **Query Not Recognized.**\nMy neural pathways did not fully parse your request. Could you rephrase your inquiry using the quick parameters below, or request human intervention?";
    response.quickReplies = ["👤 Connect to Admin", "🔙 Main Menu"];
    return response;
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