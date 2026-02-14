const { IssueService } = require('../services/issueService');

// ============ AMBULANCE ROUTES ============

// Get ambulance driver's feedback history
exports.getAmbulanceFeedback = async (req, res) => {
    try {
        const { ambulanceId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        console.log("\n========== AMBULANCE FEEDBACK ==========");
        console.log("📍 Ambulance ID:", ambulanceId);
        console.log("👤 User ID:", req.user?.id);
        console.log("👤 User Role:", req.user?.role);

        // Verify the authenticated user is requesting their own feedback
        if (req.user.id !== ambulanceId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Forbidden: You can only view your own feedback' 
            });
        }

        const result = await IssueService.getAmbulanceFeedback(ambulanceId, page, limit);
        
        // Add average rating to the response
        const ratingStats = await IssueService.getAmbulanceAverageRating(ambulanceId);
        
        res.json({
            ...result,
            average_rating: ratingStats
        });
    } catch (err) {
        console.error('❌ Get ambulance feedback error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get ambulance driver's average rating
exports.getAmbulanceRating = async (req, res) => {
    try {
        const { ambulanceId } = req.params;

        console.log("\n========== AMBULANCE RATING ==========");
        console.log("📍 Ambulance ID:", ambulanceId);
        console.log("👤 User ID:", req.user?.id);
        console.log("👤 User Role:", req.user?.role);

        if (req.user.id !== ambulanceId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Forbidden: You can only view your own rating' 
            });
        }

        const stats = await IssueService.getAmbulanceAverageRating(ambulanceId);
        res.json(stats);
    } catch (err) {
        console.error('❌ Get ambulance rating error:', err);
        res.status(500).json({ error: err.message });
    }
};

//============ CITIZEN ROUTES ============

// Submit feedback for resolved issue
exports.submitFeedback = async (req, res) => {
    try {
        const { issueId } = req.params;
        const citizenId = req.user.id;
        const { rating, after_photo_url } = req.body;

        console.log("📝 Feedback submission:", {
            issueId,
            citizenId,
            rating
        });

        if (!rating || !after_photo_url) {
            return res.status(400).json({ 
                error: 'Rating and after photo are required' 
            });
        }

        const result = await IssueService.submitFeedback(
            issueId, 
            citizenId, 
            rating, 
            after_photo_url
        );
        
        res.status(201).json(result);
    } catch (err) {
        console.error('❌ Submit feedback error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Check if user can submit feedback
exports.checkFeedbackEligibility = async (req, res) => {
    try {
        const { issueId } = req.params;
        const citizenId = req.user.id;

        const result = await IssueService.canSubmitFeedback(issueId, citizenId);
        res.json(result);
    } catch (err) {
        console.error('❌ Check feedback eligibility error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get feedback for a specific issue
exports.getIssueFeedback = async (req, res) => {
    try {
        const { issueId } = req.params;
        const feedback = await IssueService.getIssueFeedback(issueId);
        res.json(feedback);
    } catch (err) {
        console.error('❌ Get issue feedback error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ============ ADMIN ROUTES ============

// Verify feedback (mark as official)
exports.verifyFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const adminId = req.user.id;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin only' });
        }

        const result = await IssueService.verifyFeedback(feedbackId, adminId);
        res.json(result);
    } catch (err) {
        console.error('❌ Verify feedback error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get unverified feedback for verification
exports.getUnverifiedFeedback = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin only' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await IssueService.getUnverifiedFeedback(page, limit);
        res.json(result);
    } catch (err) {
        console.error('❌ Get unverified feedback error:', err);
        res.status(500).json({ error: err.message });
    }
};