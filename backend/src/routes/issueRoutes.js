const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// --- DASHBOARDS ---
// For Admins/Authorities to see high-level stats
router.get('/dashboard', authenticate, authorizeRole('admin', 'authority'), issueController.getDashboard);

// For Citizens/Ambulances to see the list/map
router.get('/', authenticate, issueController.getAllIssues);
router.get('/check-nearby', authenticate, issueController.checkNearby);

// --- DETAILS ---
router.get('/:id', authenticate, issueController.getIssueDetails);

// --- CITIZEN ACTIONS ---
router.post('/report', authenticate, authorizeRole('citizen'), issueController.reportPothole);
router.post('/:id/vote', authenticate, authorizeRole('citizen'), issueController.castVote);

// --- AMBULANCE ACTIONS ---
router.put('/:id/claim', authenticate, authorizeRole('ambulance'), issueController.claimIssue);
router.put('/:id/resolve', authenticate, authorizeRole('ambulance'), issueController.resolveIssue);

module.exports = router;