const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// All routes here require the user to be an 'admin'
router.use(authenticate, authorizeRole('admin'));

router.get('/analytics', adminController.getCityStats);
//router.get('/heatmap', adminController.getHeatmapData);
router.patch('/zones/:id/weight', adminController.updateZonePriority);
//router.delete('/issues/:id', adminController.deleteSpamIssue);

module.exports = router;