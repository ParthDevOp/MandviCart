import mongoose from "mongoose";

const flashSaleSchema = new mongoose.Schema({
    title: { type: String, default: "" },       // 🟢 Removed required: true
    subtitle: { type: String, default: "" },    // 🟢 Removed required: true
    discount: { type: String, default: "" },    // 🟢 Removed required: true
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },     // 🟢 Removed required: true, defaults to null when wiped
    active: { type: Boolean, default: true }
});

const FlashSale = mongoose.models.flashSale || mongoose.model('flashSale', flashSaleSchema);

export default FlashSale;