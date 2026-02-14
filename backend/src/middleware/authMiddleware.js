// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

exports.authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify JWT using your secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // The token should contain id and role from your loginUser method
        console.log("✅ Token verified:", { 
            id: decoded.id, 
            role: decoded.role,
            email: decoded.email 
        });
        
        // Set user from token - NO DATABASE QUERY NEEDED!
        // The token already contains the role information
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };
        
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

exports.authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        console.log("🔒 Authorize role check:", {
            userRole: req.user.role,
            allowedRoles: roles,
            path: req.path
        });
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Forbidden: Insufficient permissions',
                required_role: roles,
                current_role: req.user.role
            });
        }

        next();
    };
};