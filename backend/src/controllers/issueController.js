const supabase = require('../config/db');

// Report a new pothole
exports.reportPothole = async (req, res) => {
    const { lat, lon, description, photo_url } = req.body;
    const userId = req.user.id;

    try {
        const { data: nearby, error: searchError } = await supabase
            .rpc('check_nearby_pothole', { lat, lon });

        if (searchError) throw searchError;

        if (nearby && nearby.length > 0) {
            const masterIssueId = nearby[0].id;

            await supabase.from('sub_reports').insert({
                master_issue_id: masterIssueId,
                reporter_id: userId,
                photo_url,
                comment: description
            });

            await supabase.rpc('increment_upvote', { row_id: masterIssueId });

            return res.status(200).json({
                message: 'Report merged with existing cluster',
                issueId: masterIssueId
            });
        }

        const { data: newIssue, error: insertError } = await supabase
            .from('issues')
            .insert([{
                location: `POINT(${lon} ${lat})`,
                description,
                status: 'pending'
            }])
            .select();

        if (insertError) throw insertError;

        await supabase.from('sub_reports').insert({
            master_issue_id: newIssue[0].id,
            reporter_id: userId,
            photo_url
        });

        res.status(201).json(newIssue[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all active issues
exports.getActiveIssues = async (req, res) => {
    const { data, error } = await supabase
        .from('issues')
        .select('*')
        .not('status', 'eq', 'resolved');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

// Get nearby issues
exports.getNearbyIssues = async (req, res) => {
    try {
        const { lat, lng } = req.params;
        const { data, error } = await supabase
            .from('issues')
            .select('*')
            .lt('geography', `POINT(${lng} ${lat})`)
            .limit(20);

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get issue details
exports.getIssueDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('issues')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get issue status
exports.getIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('issues')
            .select('status')
            .eq('id', id)
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get issue weight
exports.getIssueWeight = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('issues')
            .select('weight')
            .eq('id', id)
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get ambulance ID
exports.getAmbulanceId = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('issues')
            .select('ambulance_id')
            .eq('id', id)
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cast a vote
exports.castVote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Add vote logic here
        res.json({ message: 'Vote cast' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update issue status
exports.updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('issues')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update issue weight
exports.updateIssueWeight = async (req, res) => {
    try {
        const { id } = req.params;
        const { weight } = req.body;

        const { data, error } = await supabase
            .from('issues')
            .update({ weight })
            .eq('id', id)
            .select();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};