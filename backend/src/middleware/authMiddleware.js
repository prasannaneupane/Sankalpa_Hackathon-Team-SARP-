const supabase = require('../config/db');

/**
 * Main Authentication Middleware
 * 1. Verifies the Supabase JWT.
 * 2. Fetches the role from the 'profiles' table.
 * 3. Attaches everything to req.user.
 */
const authenticate = async (req, res, next) => {
    // Get token from Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        // 1. Verify token with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // 2. Fetch role from the profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(403).json({ message: 'User profile not found' });
        }

        // 3. Attach user data + role to the request
        req.user = {
            id: user.id,
            email: user.email,
            role: profile.role,
            full_name: profile.full_name
        };

        next();
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Auth Error' });
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