import SystemSettings from "../models/SystemSetting.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        platformFeePercent: 5,        // 🟢 Fixed variable names
        deliveryFee: 40,              // 🟢 Fixed variable names
        freeDeliveryThreshold: 400,   // 🟢 Fixed variable names
        maintenanceMode: false
      });
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    // 🟢 Fixed variable names to match orderModel financials
    const { platformFeePercent, deliveryFee, freeDeliveryThreshold, maintenanceMode } = req.body;

    const settings = await SystemSettings.findOneAndUpdate(
      {}, 
      {
        platformFeePercent,
        deliveryFee,
        freeDeliveryThreshold,
        maintenanceMode
      },
      { new: true, upsert: true } 
    );

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};