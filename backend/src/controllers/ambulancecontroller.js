const dispatchService = require('../services/dispatchService');

exports.getPriorityTasks = async (req, res) => {
    try {
        // Runs the Civic Urgency Formula
        const tasks = await dispatchService.getRankedTasks();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'en-route', 'fixing'
        const result = await dispatchService.updateIssueStatus(id, status, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.resolveIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { after_photo_url } = req.body;
        const result = await dispatchService.completeRepair(id, after_photo_url, req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};