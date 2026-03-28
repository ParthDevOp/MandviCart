import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Recipient ID
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, default: 'system' }, // 'offer', 'order', 'system'
    date: { type: Number, default: Date.now }
});

const Notification = mongoose.models.notification || mongoose.model('notification', notificationSchema);

export default Notification;