const supabase = require('../config/db');

class AuthService {
    /**
     * 1. CITIZEN SELF-REGISTRATION (Public)
     * Forces role to 'citizen' regardless of what is sent.
     */
    async registerCitizen({ email, password, full_name }) {
        const role = 'citizen';

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role }
        });

        if (authError) throw new Error(authError.message);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, full_name, role }])
            .select().single();

        if (profileError) {
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(profileError.message);
        }

        return { message: "Citizen registered successfully", profile };
    }

    /**
     * 2. ADMIN-CONTROLLED CREATION (Restricted)
     * Used by the single Admin to create 'ambulance' or other 'admin' accounts.
     */
    async adminCreateUser({ email, password, full_name, role }, requesterRole) {
        // Security Check: Only the existing admin can do this
        if (requesterRole !== 'admin') {
            throw new Error("Forbidden: Only an Admin can create ambulance or admin accounts.");
        }

        const validRoles = ['ambulance', 'admin'];
        if (!validRoles.includes(role)) {
            throw new Error("Invalid role type.");
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role }
        });

        if (authError) throw new Error(authError.message);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, full_name, role,is_verified: true }])
            .select().single();

        return { message: `${role} account created successfully`, profile };
    }

    /**
     * 3. UNIVERSAL LOGIN
     * Returns the user data and role based on the database record.
     */
    async loginUser(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

        return {
            token: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: profile?.full_name,
                role: profile?.role
            }
        };
    }

    /**
     * 4. GET ALL USERS (Admin Only)
     */
    async getAllUsers(requesterRole) {
        if (requesterRole !== 'admin') throw new Error("Unauthorized");
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }
}

module.exports = new AuthService();