const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected: Get current user profile
const { authenticate } = require('../middleware/authMiddleware');
router.get('/me', authenticate, authController.getMe);

module.exports = router;