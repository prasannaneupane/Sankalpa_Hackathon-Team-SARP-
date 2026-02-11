const supabase = require('../config/db');

class AdminService {
    async fetchAnalytics() {
        const { data: issues } = await supabase.from('issues').select('status');
        
        const stats = {
            total: issues.length,
            pending: issues.filter(i => i.status === 'pending').length,
            resolved: issues.filter(i => i.status === 'resolved').length
        };

        return stats;
    }

    async setZoneWeight(zoneId, newWeight) {
        // Manual override for high-priority areas (like schools)
        return await supabase
            .from('issues')
            .update({ weight: newWeight })
            .filter('location', 'contained_in_zone', zoneId); 
    }
}

module.exports = new AdminService();
