import mongoose from "mongoose";

const featureBannerSchema = new mongoose.Schema({
    mainTitle: { type: String, required: true },
    mainImage: { type: String, required: true }, // URL
    features: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
            icon: { type: String } // e.g., "truck", "leaf", "wallet"
        }
    ],
    active: { type: Boolean, default: true }
});

const FeatureBanner = mongoose.models.featureBanner || mongoose.model('featureBanner', featureBannerSchema);

export default FeatureBanner;