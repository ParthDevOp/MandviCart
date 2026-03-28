import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "CREATED_ADMIN", "BANNED_USER"
    target: { type: String }, // e.g., "User: John Doe"
    details: { type: Object },
    timestamp: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.models.activityLog || mongoose.model("activityLog", activityLogSchema);
export default ActivityLog;