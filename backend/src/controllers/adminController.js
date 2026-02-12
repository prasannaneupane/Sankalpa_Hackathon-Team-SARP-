const adminServices = require('../services/adminService');

const adminController = {
    // 1. Fetch only users with the 'citizen' role
    getCitizens: async (req, res) => {
        try {
            const data = await adminServices.getAllCitizens();
            res.status(200).json({ 
                success: true, 
                count: data.length, 
                data 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 2. Fetch ambulance profiles + vehicle details
    getAmbulances: async (req, res) => {
        try {
            const data = await adminServices.getAllAmbulanceUnits();
            res.status(200).json({ 
                success: true, 
                count: data.length, 
                data 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Fetch all reported issues
    getIssues: async (req, res) => {
        try {
            const data = await adminServices.getAllIssues();
            res.status(200).json({ 
                success: true, 
                count: data.length, 
                data 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = adminController;