import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true }, // e.g., 'hero_banner', 'flash_sale'
    data: { type: Object, required: true }, // Flexible storage for JSON data
    isActive: { type: Boolean, default: true }
});

const Content = mongoose.models.content || mongoose.model("content", contentSchema);
export default Content;