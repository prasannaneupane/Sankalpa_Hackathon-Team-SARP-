const supabase = require('../config/db');

class DispatchService {
    // Calculate Priority: (Up - 2Down) + (Weight Stagnation)
    calculatePriority(issue) {
        const now = new Date();
        const created = new Date(issue.created_at);
        const hoursOpen = Math.max(1, (now - created) / (1000 * 60 * 60));

        const score = (issue.upvote_count) - (issue.downvote_count * 2) + (issue.weight * (hoursOpen / 24));
        return Math.round(score);
    }

    async getRankedTasks() {
        const { data: issues, error } = await supabase
            .from('issues')
            .select('*')
            .eq('status', 'pending');

        if (error) throw error;

        return issues
            .map(issue => ({
                ...issue,
                priorityScore: this.calculatePriority(issue)
            }))
            .sort((a, b) => b.priorityScore - a.priorityScore);
    }

    async completeRepair(issueId, afterPhotoUrl, driverId) {
        // 1. Update issue status
        const { error: updateError } = await supabase
            .from('issues')
            .update({ status: 'resolved', updated_at: new Date() })
            .eq('id', issueId);

        if (updateError) throw updateError;

        // 2. Log proof in feedback table
        return await supabase.from('feedback').insert({
            issue_id: issueId,
            after_photo_url: afterPhotoUrl,
            driver_id: driverId
        });
    }
}

module.exports = new DispatchService();