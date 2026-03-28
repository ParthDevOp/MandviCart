import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    image: { type: String, required: true }, // URL from Cloudinary or placeholder
    bgColor: { type: String, default: "#f0fdf4" },
    active: { type: Boolean, default: true }
});

// Check if model exists to avoid recompilation errors
const Banner = mongoose.models.banner || mongoose.model('banner', bannerSchema);

export default Banner;