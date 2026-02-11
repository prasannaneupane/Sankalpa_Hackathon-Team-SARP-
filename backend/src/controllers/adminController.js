const adminService = require('../services/adminService');

exports.getCityStats = async (req, res) => {
    try {
        const stats = await adminService.fetchAnalytics();
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateZonePriority = async (req, res) => {
    try {
        const { id } = req.params; // Zone ID
        const { weight } = req.body;
        const result = await adminService.setZoneWeight(id, weight);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};