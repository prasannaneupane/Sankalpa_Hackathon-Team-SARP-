import API_BASE_URL from "../config";

const getToken = () => localStorage.getItem("token");

export const feedbackService = {
  // Check if user can submit feedback
  async checkEligibility(issueId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/issues/${issueId}/feedback/check`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      return await response.json();
    } catch (err) {
      console.error("Error checking feedback eligibility:", err);
      return { canSubmit: false, reason: "Unable to check feedback eligibility" };
    }
  },

  // Submit feedback for resolved issue

    async submitFeedback(issueId, citizenId, rating, afterPhotoUrl) {
        try {
            // Validate rating (1-5)
            if (!rating || rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            // Check if issue exists and is resolved
            const { data: issue, error: issueError } = await supabase
                .from('issues')
                .select('id, ambulance_id, status')
                .eq('id', issueId)
                .single();

            if (issueError) throw issueError;
            
            if (issue.status !== 'resolved') {
                throw new Error('Feedback can only be submitted for resolved issues');
            }

            if (!issue.ambulance_id) {
                throw new Error('No ambulance was assigned to this issue');
            }

            // Check if feedback already exists
            const { data: existingFeedback } = await supabase
                .from('feedback')
                .select('id')
                .eq('issue_id', issueId)
                .eq('citizen_id', citizenId)
                .maybeSingle();

            if (existingFeedback) {
                throw new Error('You have already submitted feedback for this issue');
            }

            // IMPORTANT: Include ambulance_id in the insert!
            const { data: feedback, error: feedbackError } = await supabase
                .from('feedback')
                .insert([{
                    issue_id: issueId,
                    citizen_id: citizenId,
                    ambulance_id: issue.ambulance_id, // ← THIS IS CRITICAL
                    after_photo_url: afterPhotoUrl,
                    citizen_rating: rating,
                    rdo_verified: false,
                    created_at: new Date()
                }])
                .select()
                .single();

            if (feedbackError) {
                console.error('❌ Feedback insert error:', feedbackError);
                throw feedbackError;
            }

            // Update ambulance driver's average rating
            await this.updateAmbulanceRating(issue.ambulance_id);

            return {
                success: true,
                message: 'Feedback submitted successfully',
                feedback
            };
        } catch (error) {
            console.error('❌ submitFeedback error:', error);
            throw error;
        }
    },

  // Get feedback for specific issue
  async getIssueFeedback(issueId) {
    const response = await fetch(
      `${API_BASE_URL}/feedback/issues/${issueId}/feedback`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return await response.json();
  },

  // Get ambulance driver's feedback history
  async getAmbulanceFeedback(ambulanceId, page = 1, limit = 10) {
    const response = await fetch(
      `${API_BASE_URL}/feedback/ambulance/${ambulanceId}/feedback?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return await response.json();
  },

  // Get ambulance driver's rating
  async getAmbulanceRating(ambulanceId) {
    const response = await fetch(
      `${API_BASE_URL}/feedback/ambulance/${ambulanceId}/rating`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return await response.json();
  }
};