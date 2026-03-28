import SystemSettings from "../models/SystemSetting.js";

// GET Settings (Proxy for Maintenance Mode status)
const getSiteSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({}); // Create default if missing
        }
        
        // We only return what the CMS frontend needs
        res.json({ 
            success: true, 
            settings: {
                maintenanceMode: settings.maintenanceMode,
                // Banners/FlashSale are handled by specific content routes, 
                // but we can return basic flags here if needed.
            } 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// UPDATE Settings (Maintenance Mode Only)
const updateSiteSettings = async (req, res) => {
    try {
        const { maintenanceMode } = req.body;
        
        // Only updating maintenance mode here. 
        // Banners have their own separate add/delete endpoints.
        const settings = await SystemSettings.findOneAndUpdate(
            {}, 
            { maintenanceMode }, 
            { new: true, upsert: true }
        );

        res.json({ success: true, message: "Maintenance Status Updated", settings });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export { getSiteSettings, updateSiteSettings };