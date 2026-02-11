const supabase = require('../config/db');

class IssueService {
    // NEW: Dashboard Stats Function
    async getAdminDashboard() {
        // Fetch summary stats from the view we created
        const { data: stats, error: statsError } = await supabase
            .from('dashboard_summary')
            .select('*')
            .single();
        
        // Fetch top 5 most urgent issues
        const { data: hotSpots, error: hotError } = await supabase
            .from('issues')
            .select('id, description, weight, location')
            .neq('status', 'resolved')
            .order('weight', { ascending: false })
            .limit(5);

        if (statsError || hotError) throw statsError || hotError;
        return { stats, hotSpots };
    }

    // --- CITIZEN: CLUSTERING & REPORTING ---
    async getNearbyIssue(lat, lon) {
        const { data, error } = await supabase.rpc('check_nearby_pothole', { 
            lat: parseFloat(lat), lon: parseFloat(lon) 
        });
        if (error) throw error;
        return data?.[0] ? { nearbyFound: true, existingIssue: data[0] } : { nearbyFound: false };
    }

    async reportPothole(userId, data) {
        const { lat, lon, description, photo_url, isDuplicate, masterIssueId } = data;
        if (isDuplicate && masterIssueId) {
            await supabase.rpc('cast_secure_vote', { target_issue_id: masterIssueId, voting_user_id: userId, new_vote_value: 1 });
            await supabase.from('sub_reports').insert({ master_issue_id: masterIssueId, reporter_id: userId, photo_url, comment: description });
            return { status: 'merged', issueId: masterIssueId };
        }
        const { data: newIssue, error } = await supabase.from('issues')
            .insert([{ location: `POINT(${lon} ${lat})`, description, status: 'pending', weight: 1 }])
            .select().single();
        if (error) throw error;
        await supabase.from('votes').insert({ user_id: userId, issue_id: newIssue.id, vote_value: 1 });
        await supabase.from('sub_reports').insert({ master_issue_id: newIssue.id, reporter_id: userId, photo_url });
        return { status: 'created', issue: newIssue };
    }

    // --- VOTING & AMBULANCE ---
    async castVote(issueId, userId, voteValue) {
        const { data, error } = await supabase.rpc('cast_secure_vote', { 
            target_issue_id: issueId, voting_user_id: userId, new_vote_value: voteValue 
        });
        if (error) throw error;
        return { result: data };
    }

    async claimIssue(issueId, ambulanceId) {
            console.log("Claiming Issue:", issueId, "with Ambulance:", ambulanceId);

            // 1. Update ONLY if status is still 'pending'
            const { data, error } = await supabase.from('issues')
                .update({ 
                    ambulance_id: ambulanceId, 
                    status: 'assigned',
                    assigned_at: new Date() // Good for tracking response times
                })
                .eq('id', issueId)
                .eq('status', 'pending') // THE SAFETY LOCK: Prevents double claiming
                .select();
            
            if (error) {
                console.error("DB Error during claim:", error.message);
                throw error;
            }

            // 2. Check if the update actually happened
            if (!data || data.length === 0) {
                // If we reach here, it means the issue was either not found 
                // OR its status was no longer 'pending' (someone else got it)
                throw new Error("This issue is no longer available or has already been claimed.");
            }

            // 3. Update the Ambulance Status (Optional but recommended)
            // This marks the ambulance as 'busy' so they can't claim 10 things at once
            await supabase
                .from('ambulance_units')
                .update({ is_available: false })
                .eq('driver_id', ambulanceId);
            
            return data[0];
    }
    async resolveIssue(issueId, ambulanceId, resolveData) {
        const { data, error } = await supabase.from('issues')
            .update({ status: 'resolved', resolution_photo: resolveData.photo_url, resolution_comment: resolveData.comment, resolved_at: new Date() })
            .eq('id', issueId).eq('ambulance_id', ambulanceId).select();
        if (error) throw error;
        return data[0];
    }
}
module.exports = new IssueService();