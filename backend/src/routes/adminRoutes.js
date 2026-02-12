const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

/**
 * ALL ROUTES BELOW ARE PROTECTED
 * Requirement: Valid JWT + Role === 'admin'
 */
router.use(authenticate, authorizeRole('admin'));

// Individual endpoints for targeted dashboard views
router.get('/view-citizens', adminController.getCitizens);
router.get('/view-ambulances', adminController.getAmbulances);
router.get('/view-issues', adminController.getIssues);

module.exports = router;