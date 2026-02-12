const supabase = require('../config/db'); 

const adminServices = {
    /**
     * View All Citizens (unchanged)
     */
    getAllCitizens: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, is_verified, reputation_score, created_at')
            .eq('role', 'citizen')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * View All Ambulance Units (JOINED)
     * Fetches vehicle data AND driver profile info
     */
    getAllAmbulanceUnits: async () => {
        const { data, error } = await supabase
            .from('ambulance_units')
            .select(`
                id,
                vehicle_plate,
                is_available,
                current_location,
                driver_info:profiles!driver_id (
                    full_name,
                    is_verified,
                    reputation_score
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * View All Issues
     */
    getAllIssues: async () => {
        const { data, error } = await supabase
            .from('issues')
            .select('*')
            .order('weight', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = adminServices;