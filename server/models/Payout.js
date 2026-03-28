import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['seller', 'rider'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending' },
    requestDate: { type: Date, default: Date.now },
    paidDate: { type: Date },
    transactionId: { type: String } // For manual entry reference
});

const Payout = mongoose.models.payout || mongoose.model("payout", payoutSchema);
export default Payout;