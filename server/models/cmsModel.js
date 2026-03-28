import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema({
    type: { type: String, default: 'siteSettings', unique: true },
    
    // 🔴 Global Switch
    maintenanceMode: { type: Boolean, default: false },

    // Homepage Banner Settings (Optional extras)
    heroBanner: {
        title: { type: String, default: 'Order your favourites' },
        subtitle: { type: String, default: 'Fresh & Organic' },
        image: { type: String, default: '' },
        buttonText: { type: String, default: 'Shop Now' }
    },
    flashSale: {
        active: { type: Boolean, default: false },
        endDate: { type: Date },
        offerPercentage: { type: Number, default: 20 },
        title: { type: String, default: 'Flash Sale!' }
    }
}, { minimize: false });

const cmsModel = mongoose.models.cms || mongoose.model("cms", cmsSchema);
export default cmsModel;