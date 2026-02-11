// const express = require('express');
// const router = express.Router();
// const issueController = require('../controllers/issueController');
// const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// // Public: Everyone can see the map and specific pothole details
// router.get('/active', issueController.getActiveIssues);
// //router.get('/:id', issueController.getIssueDetails);

// // Protected: Only logged-in citizens can report or vote
// router.post('/report', authenticate, authorizeRole('citizen'), issueController.reportPothole);
// //router.post('/:id/vote', authenticate, authorizeRole('citizen'), issueController.castVote);

// module.exports = router;

const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// Public: Everyone can see the map and specific pothole details
router.get('/active', issueController.getActiveIssues);
router.get('/nearby/:lat/:lng', issueController.getNearbyIssues); // Specific route BEFORE generic /:id
router.get('/:id', issueController.getIssueDetails);
router.get('/:id/status', issueController.getIssueStatus);
router.get('/:id/weight', issueController.getIssueWeight);
router.get('/:id/ambulance', issueController.getAmbulanceId);

// Protected: Only logged-in citizens can report or vote
router.post('/report', authenticate, authorizeRole('citizen'), issueController.reportPothole);
router.post('/:id/vote', authenticate, authorizeRole('citizen'), issueController.castVote);

// Update routes (admin/authority only)
router.put('/:id/status', authenticate, authorizeRole('authority', 'admin'), issueController.updateIssueStatus);
router.put('/:id/weight', authenticate, authorizeRole('authority', 'admin'), issueController.updateIssueWeight);

module.exports = router;