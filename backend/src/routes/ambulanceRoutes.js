const express = require('express');
const router = express.Router();
const ambController = require('../controllers/ambulanceController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// All routes here require the user to be an 'ambulance_driver'
router.use(authenticate, authorizeRole('driver'));

// Get tasks sorted by the Civic Urgency Formula
router.get('/tasks', ambController.getPriorityTasks);

// Update status (e.g., 'pending' -> 'en-route')
router.patch('/task/:id/status', ambController.updateStatus);

// Proof of Work: Resolve with 'After' photo
router.post('/task/:id/resolve', ambController.resolveIssue);

module.exports = router;