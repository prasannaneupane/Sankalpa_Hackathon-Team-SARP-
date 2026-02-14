const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
    async adminCreateUser({ email, password, full_name, role, vehicle_plate }, requesterRole) {
        if (requesterRole !== 'admin') throw new Error("Forbidden");

        // 1. Auth Creation
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name, role }
        });
        if (authError) throw new Error(`Auth Error: ${authError.message}`);

        // 2. Profile Creation
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
                id: authData.user.id, 
                full_name, 
                role, 
                is_verified: true,
                reputation_score: 100 
            }])
            .select().single();

        if (profileError) {
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(`DB_STEP_PROFILE: ${profileError.message}`);
        }

        // 3. Ambulance Unit Creation - USING VEHICLE PLATE FROM FRONTEND
        if (role === 'ambulance') {
            // Check if vehicle plate already exists
            const { data: existingVehicle } = await supabase
                .from('ambulance_units')
                .select('vehicle_plate')
                .eq('vehicle_plate', vehicle_plate)
                .single();

            if (existingVehicle) {
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Vehicle plate ${vehicle_plate} is already registered`);
            }

            const { error: unitError } = await supabase
                .from('ambulance_units')
                .insert([{
                    driver_id: profile.id,
                    vehicle_plate: vehicle_plate, // USING PLATE FROM FRONTEND
                    is_available: true,
                    created_at: new Date()
                }]);

            if (unitError) {
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(`DB_STEP_UNIT: ${unitError.message}`);
            }
        }

        return { 
            message: "Ambulance Created Successfully!", 
            profile,
            vehicle_plate // Return the assigned plate
        };
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

        // Create a NEW token that includes the role
        const customToken = jwt.sign(
            { 
                id: data.user.id, 
                role: profile?.role, 
                email: data.user.email 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        return {
            token: customToken, // ✅ This is correct
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: profile?.full_name,
                role: profile?.role  // ✅ Role is here
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