const authService = require('../services/authService');

// Public: Anyone can register as a citizen
exports.register = async (req, res) => {
    try {
        const result = await authService.registerCitizen(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Restricted: Only the Admin can call this to create Ambulances
exports.adminCreateUser = async (req, res) => {
    try {
        // req.user is populated by your authMiddleware
        const result = await authService.adminCreateUser(req.body, req.user.role);
        res.status(201).json(result);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await authService.getAllUsers(req.user.role);
        res.status(200).json(users);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
};