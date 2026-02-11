const supabase = require('../config/db');

class AuthService {
    /**
     * Registers a user in Supabase Auth and creates a custom profile
     */
    async registerUser({ email, password, full_name, role }) {
        // 1. Sign up the user in Supabase Authentication
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw new Error(authError.message);

        // 2. Create the entry in our public 'profiles' table
        // This links the Auth ID to our business roles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([
                { 
                    id: authData.user.id, 
                    full_name, 
                    role: role || 'citizen' // Default role
                }
            ])
            .select()
            .single();

        if (profileError) throw new Error(profileError.message);

        return { user: authData.user, profile };
    }

    /**
     * Authenticates the user and returns the session
     */
    async loginUser(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw new Error(error.message);

        // Fetch the user's role from the profile table to send back to the frontend
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        return {
            token: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: profile?.role
            }
        };
    }

    /**
     * Gets user data from token context
     */
    async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw new Error(profileError.message);
        return data;
    }
}

module.exports = new AuthService();