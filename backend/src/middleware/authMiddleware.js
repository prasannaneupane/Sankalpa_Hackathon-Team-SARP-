const supabase = require('../config/db');

const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    // 1. Get token from header (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided. Access denied." });
    }

    try {
        // 2. Verify the token using your secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach the payload (id, role) to the request object
        req.user = decoded; 
        
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

/**
 * Role-Specific Authorization
 * Use this to restrict specific routes to 'admin' or 'ambulance' only.
 */
const authorizeRole = (allowedRole) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== allowedRole) {
            return res.status(403).json({ 
                message: `Forbidden: This action requires the ${allowedRole} role.` 
            });
        }
        next();
    };
};

module.exports = { authenticate, authorizeRole };