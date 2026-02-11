const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/authMiddleware');

// Citizens rate the repair quality
router.post('/verify/:id', authenticate, feedbackController.submitFeedback);
router.get('/leaderboard', feedbackController.getLeaderboard);

module.exports = router;