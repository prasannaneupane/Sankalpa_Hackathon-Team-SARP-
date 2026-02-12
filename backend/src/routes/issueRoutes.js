const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../services/issueService');

// --- DASHBOARDS ---
router.get('/dashboard', issueController.getDashboard);

// --- CITIZEN FEED WITH VOTE SCORES ---
router.get('/', authenticate, issueController.getAllIssues);
router.get('/check-nearby', authenticate, issueController.checkNearby);
router.get('/map', authenticate, issueController.getIssuesForMap);

// --- USER VOTES --- ✅ THIS WAS MISSING!
router.get('/votes/my-votes', authenticate, issueController.getMyVotes);

// --- DETAILS ---
router.get('/:id', authenticate, issueController.getIssueDetails);

// --- CITIZEN ACTIONS ---
router.post(
    '/report', 
    authenticate, 
    authorizeRole('citizen'),
    uploadMiddleware,
    issueController.reportPothole
);

router.post('/:id/vote', authenticate, authorizeRole('citizen'), issueController.castVote);

// --- AMBULANCE ACTIONS ---
router.put('/:id/claim', authenticate, authorizeRole('ambulance'), issueController.claimIssue);
router.put(
    '/:id/resolve', 
    authenticate, 
    authorizeRole('ambulance'),
    uploadMiddleware, // ✅ Add this to handle file upload
    issueController.resolveIssue
);

module.exports = router;