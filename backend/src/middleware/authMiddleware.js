const supabase = require('../config/db');

/**
 * 1. authenticate: Validates the Supabase JWT
 */
const authenticate = async (req, res, next) => {
    // Get token from the Authorization header (Format: Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        // Ask Supabase to verify this token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Attach the user object to the request so controllers can use req.user.id
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Auth Error' });
    }
};

/**
 * 2. authorizeRole: Restricts access based on the "role" column in your profiles table
 */
const authorizeRole = (allowedRole) => {
    return async (req, res, next) => {
        try {
            // Since roles are in our custom 'profiles' table, we fetch it using the user ID
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', req.user.id)
                .single();

            if (error || !profile) {
                return res.status(403).json({ message: 'User profile not found' });
            }

            if (profile.role !== allowedRole) {
                return res.status(403).json({ 
                    message: `Forbidden: This action requires the ${allowedRole} role.` 
                });
            }

            // User is authenticated AND has the right role
            next();
        } catch (err) {
            return res.status(500).json({ message: 'Role authorization error' });
        }
    };
};

module.exports = { authenticate, authorizeRole };