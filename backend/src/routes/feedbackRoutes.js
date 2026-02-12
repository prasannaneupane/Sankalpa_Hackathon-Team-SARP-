const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// ============ AMBULANCE ROUTES ============
// These must come BEFORE any parameterized routes

// Get ambulance driver's feedback history
router.get(
    '/ambulance/:ambulanceId/feedback',
    authenticate,
    authorizeRole(['ambulance', 'admin']),
    feedbackController.getAmbulanceFeedback
);

// Get ambulance driver's rating stats
router.get(
    '/ambulance/:ambulanceId/rating',
    authenticate,
    authorizeRole(['ambulance', 'admin', 'citizen']),
    feedbackController.getAmbulanceRating
);

// ============ CITIZEN ROUTES ============

// Submit feedback for resolved issue
router.post(
    '/issues/:issueId/feedback',
    authenticate,
    authorizeRole('citizen'),
    feedbackController.submitFeedback
);

// Check if user can submit feedback
router.get(
    '/issues/:issueId/feedback/check',
    authenticate,
    authorizeRole('citizen'),
    feedbackController.checkFeedbackEligibility
);

// Get feedback for specific issue
router.get(
    '/issues/:issueId/feedback',
    authenticate,
    feedbackController.getIssueFeedback
);

// ============ ADMIN ROUTES ============

// Verify feedback (mark as official)
router.put(
    '/verify/:feedbackId',
    authenticate,
    authorizeRole(['admin']),
    feedbackController.verifyFeedback
);

// Get unverified feedback for verification
router.get(
    '/unverified',
    authenticate,
    authorizeRole(['admin']),
    feedbackController.getUnverifiedFeedback
);

module.exports = router;