import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    status: { type: String, default: 'Pending' }, // 'Pending', 'Resolved'
    date: { type: Number, default: Date.now }
});

const Query = mongoose.models.query || mongoose.model('query', querySchema);

export default Query;