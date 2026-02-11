const supabase = require('../config/db');

class IssueService {
    // 1. Logic for 5-meter clustering
    async processReport(lat, lon, description, photoUrl, userId) {
        // Call the PostGIS RPC function to find a nearby issue
        const { data: nearby, error: searchError } = await supabase
            .rpc('check_nearby_pothole', { lat, lon });

        if (searchError) throw searchError;

        if (nearby && nearby.length > 0) {
            const masterId = nearby[0].id;
            
            // Increment upvote for the master issue
            await supabase.rpc('increment_upvote', { row_id: masterId });

            // Create a sub-report (evidence cluster)
            return await supabase.from('sub_reports').insert({
                master_issue_id: masterId,
                reporter_id: userId,
                photo_url: photoUrl,
                comment: description
            });
        }

        // Create a brand new Master Issue if no cluster found
        const { data: newIssue, error: insertError } = await supabase
            .from('issues')
            .insert([{ 
                location: `POINT(${lon} ${lat})`, 
                description,
                status: 'pending' 
            }])
            .select();

        if (insertError) throw insertError;

        // Link the first sub-report to the new master issue
        await supabase.from('sub_reports').insert({
            master_issue_id: newIssue[0].id,
            reporter_id: userId,
            photo_url: photoUrl
        });

        return newIssue[0];
    }

    async getMapIssues() {
        const { data, error } = await supabase
            .from('issues')
            .select('*, sub_reports(photo_url)')
            .neq('status', 'resolved');
        if (error) throw error;
        return data;
    }
}

module.exports = new IssueService();