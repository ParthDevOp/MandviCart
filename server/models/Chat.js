import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: String, enum: ['user', 'admin'], required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 👈 Track WHICH admin replied
    text: { type: String },
    image: { type: String },
    quickReplies: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
    // Current Active Conversation
    messages: [messageSchema],
    
    // Chat Status
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    
    // History of Previous Conversations
    archived: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        closedAt: { type: Date, default: Date.now },
        messages: [messageSchema]
    }],

    lastUpdated: { type: Date, default: Date.now },
    isReadByAdmin: { type: Boolean, default: false },
    isReadByUser: { type: Boolean, default: true }
});

const Chat = mongoose.models.chat || mongoose.model("chat", chatSchema);
export default Chat;