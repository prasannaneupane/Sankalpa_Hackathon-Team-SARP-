const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
// Citizens register themselves
router.post('/register', authController.register);

// Everyone logs in here
router.post('/login', authController.login);


// --- PROTECTED ROUTES ---
// 1. Admin creates Ambulance or another Admin
// First we check if they are logged in (authenticate)
// Then we check if they are an admin (authorizeRole)
router.post(
    '/admin/create-user', 
    authenticate, 
    authorizeRole('admin'), 
    authController.adminCreateUser
);

// 2. Admin views all users
router.get(
    '/users', 
    authenticate, 
    authorizeRole('admin'), 
    authController.getUsers
);

module.exports = router;