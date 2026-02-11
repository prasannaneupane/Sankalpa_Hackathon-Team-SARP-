const IssueService = require('../services/issueService');
const supabase = require('../config/db');

// NEW: The requested Dashboard endpoint
exports.getDashboard = async (req, res) => {
    try {
        const data = await IssueService.getAdminDashboard();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllIssues = async (req, res) => {
    try {
        let query = supabase.from('issues').select('*, sub_reports(count)');
        if (req.query.status) query = query.eq('status', req.query.status);
        const { data } = await query.order('weight', { ascending: false });
        res.json(data || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getIssueDetails = async (req, res) => {
    const { data } = await supabase.from('issues').select('*, sub_reports(*)').eq('id', req.params.id).single();
    res.json(data || { error: "Not found" });
};

exports.checkNearby = async (req, res) => {
    try { res.json(await IssueService.getNearbyIssue(req.query.lat, req.query.lon)); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.reportPothole = async (req, res) => {
    try { res.status(201).json(await IssueService.reportPothole(req.user.id, req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.castVote = async (req, res) => {
    try { res.json(await IssueService.castVote(req.params.id, req.user.id, req.body.voteValue)); }
    catch (err) { res.status(400).json({ error: err.message }); }
};

exports.claimIssue = async (req, res) => {
    try { res.json(await IssueService.claimIssue(req.params.id, req.user.id)); }
    catch (err) { res.status(400).json({ error: err.message }); }
};

exports.resolveIssue = async (req, res) => {
    try { res.json(await IssueService.resolveIssue(req.params.id, req.user.id, req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
};