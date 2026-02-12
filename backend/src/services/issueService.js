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
            .order('weight', { ascending: false });

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
        const { data, error } = await supabase.rpc('cast_secure_vote_v2', { 
            target_issue_id: issueId, voting_user_id: userId, new_vote_value: voteValue 
        });
        if (error) throw error;
        return { result: data };
    }

    // ✅ GET USER'S VOTES - For showing active votes on frontend
    async getUserVotes(userId) {
        const { data, error } = await supabase
            .from('votes')
            .select('issue_id, vote_value')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
    }

    // ✅ GET ALL ISSUES WITH VOTE SCORES - For citizen dashboard
    async getIssuesWithScores(filters = {}, page = 1, limit = 10) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        let query = supabase
            .from('issues')
            .select(`
                *,
                sub_reports(count)
            `);
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        const { data: issues, error: issuesError } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (issuesError) throw issuesError;
        
        // Get vote sums for each issue
        const issueIds = issues.map(issue => issue.id);
        
        const { data: votes, error: votesError } = await supabase
            .from('votes')
            .select('issue_id, vote_value')
            .in('issue_id', issueIds);
        
        if (votesError) throw votesError;
        
        // Calculate total vote score (sum of all vote_values) for each issue
        const issuesWithScores = issues.map(issue => {
            const issueVotes = votes.filter(v => v.issue_id === issue.id);
            const totalScore = issueVotes.reduce((sum, vote) => sum + vote.vote_value, 0);
            
            return {
                ...issue,
                vote_score: totalScore,
                total_votes: issueVotes.length
            };
        });
        
        return issuesWithScores;
    }

    // ✅ GET SINGLE ISSUE WITH VOTE SCORE - For issue details page
    async getIssueWithScore(issueId) {
        const { data: issue, error: issueError } = await supabase
            .from('issues')
            .select(`
                *,
                sub_reports(*)
            `)
            .eq('id', issueId)
            .single();
        
        if (issueError) throw issueError;
        
        const { data: votes, error: votesError } = await supabase
            .from('votes')
            .select('vote_value, user_id')
            .eq('issue_id', issueId);
        
        if (votesError) throw votesError;
        
        const totalScore = votes.reduce((sum, vote) => sum + vote.vote_value, 0);
        
        return {
            ...issue,
            vote_score: totalScore,
            total_votes: votes.length,
            voters: votes.map(v => v.user_id)
        };
    }

    // ✅ GET ISSUES BY LOCATION - For map view
    async getIssuesByLocation(bounds) {
        // This is a placeholder - implement based on your needs
        const { data, error } = await supabase
            .from('issues')
            .select('id, description, location, status, weight, created_at')
            .not('status', 'eq', 'resolved')
            .limit(100);
        
        if (error) throw error;
        return data || [];
    }

    // --- AMBULANCE CLAIM & RESOLVE (UNCHANGED) ---
    async claimIssue(issueId, ambulanceId) {
        console.log("Claiming Issue:", issueId, "with Ambulance:", ambulanceId);

        const { data, error } = await supabase.from('issues')
            .update({ 
                ambulance_id: ambulanceId, 
                status: 'assigned',
                assigned_at: new Date()
            })
            .eq('id', issueId)
            .eq('status', 'pending')
            .select();
        
        if (error) {
            console.error("DB Error during claim:", error.message);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error("This issue is no longer available or has already been claimed.");
        }

        await supabase
            .from('ambulance_units')
            .update({ is_available: false })
            .eq('driver_id', ambulanceId);
        
        return data[0];
    }

    async resolveIssue(issueId, ambulanceId, resolveData) {
        const { data, error } = await supabase.from('issues')
            .update({ 
                status: 'resolved', 
                resolution_photo: resolveData.photo_url, 
                resolution_comment: resolveData.comment, 
                resolved_at: new Date() 
            })
            .eq('id', issueId)
            .eq('ambulance_id', ambulanceId)
            .select();
        
        if (error) throw error;
        return data[0];
    }

    // --- LEGACY METHODS (KEPT FOR BACKWARD COMPATIBILITY) ---
    // These methods are kept to prevent breaking existing code
    // You can remove these once you've updated all controllers to use the new methods

    async getAllIssues(filters = {}) {
        console.warn("⚠️ getAllIssues is deprecated. Use getIssuesWithScores instead.");
        
        let query = supabase.from('issues').select('*, sub_reports(count)');
        if (filters.status) query = query.eq('status', filters.status);
        const { data } = await query.order('weight', { ascending: false });
        return data || [];
    }

    async getIssueDetails(issueId) {
        console.warn("⚠️ getIssueDetails is deprecated. Use getIssueWithScore instead.");
        
        const { data } = await supabase
            .from('issues')
            .select('*, sub_reports(*)')
            .eq('id', issueId)
            .single();
        
        return data || { error: "Not found" };
    }
}

module.exports = new IssueService();