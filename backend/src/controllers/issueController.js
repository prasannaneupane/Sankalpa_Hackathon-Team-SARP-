const IssueService = require('../services/issueService');
const supabase = require('../config/db');

// NEW: Dashboard endpoint (unchanged)
exports.getDashboard = async (req, res) => {
    try {
        const data = await IssueService.getAdminDashboard();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ UPDATED: Use getIssuesWithScores for citizen feed
exports.getAllIssues = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        
        const issues = await IssueService.getIssuesWithScores(filters, page, limit);
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ UPDATED: Use getIssueWithScore for details
exports.getIssueDetails = async (req, res) => {
    try {
        const issue = await IssueService.getIssueWithScore(req.params.id);
        res.json(issue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ NEW: Get current user's votes
exports.getMyVotes = async (req, res) => {
    try {
        const votes = await IssueService.getUserVotes(req.user.id);
        res.json(votes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ NEW: Get issues for map view
exports.getIssuesForMap = async (req, res) => {
    try {
        const issues = await IssueService.getIssuesByLocation(req.query.bounds);
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- UNCHANGED METHODS ---
exports.checkNearby = async (req, res) => {
    try { 
        res.json(await IssueService.getNearbyIssue(req.query.lat, req.query.lon)); 
    }
    catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.reportPothole = async (req, res) => {
    try { 
        res.status(201).json(await IssueService.reportPothole(req.user.id, req.body)); 
    }
    catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.castVote = async (req, res) => {
    try { 
        res.json(await IssueService.castVote(req.params.id, req.user.id, req.body.voteValue)); 
    }
    catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
};

exports.claimIssue = async (req, res) => {
    try { 
        res.json(await IssueService.claimIssue(req.params.id, req.user.id)); 
    }
    catch (err) { 
        res.status(400).json({ error: err.message }); 
    }
};

exports.resolveIssue = async (req, res) => {
    try { 
        res.json(await IssueService.resolveIssue(req.params.id, req.user.id, req.body)); 
    }
    catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};