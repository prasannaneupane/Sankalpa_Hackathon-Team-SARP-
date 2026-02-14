const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

/**
 * ALL ROUTES BELOW ARE PROTECTED
 * Requirement: Valid JWT + Role === 'admin'
 */
router.use(authenticate, authorizeRole('admin'));

// Dashboard endpoints
router.get('/view-citizens', adminController.getCitizens);
router.get('/view-ambulances', adminController.getAmbulances);
router.get('/view-issues', adminController.getIssues);
router.get('/dashboard-stats', adminController.getDashboardStats);

// Ambulance management
router.post('/create-ambulance', adminController.createAmbulance);
router.put('/ambulances/:id/status', adminController.toggleAmbulanceStatus);
router.put('/ambulances/:id/reset-password', adminController.resetAmbulancePassword);

// Issue management
router.delete('/issues/:id', adminController.deleteIssue);

module.exports = router;