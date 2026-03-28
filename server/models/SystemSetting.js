import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema({
    platformFeePercent: { type: Number, default: 5 },
    deliveryFee: { type: Number, default: 40 },
    freeDeliveryThreshold: { type: Number, default: 500 },
    maintenanceMode: { type: Boolean, default: false }
});

const SystemSetting = mongoose.models.systemSetting || mongoose.model("systemSetting", systemSettingSchema);
export default SystemSetting;