const supabase = require('../config/db');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)'));
    }
  }
}).single('image');

class IssueServiceClass {
    // ============ IMAGE UPLOAD TO SUPABASE STORAGE ============
    
    async uploadImageToStorage(file, userId) {
        console.log('🔍 ENV CHECK:');
        console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
        console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
        console.log('  Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
        console.log('  Key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 15) + '...');
    
        try {
            if (!file || !file.buffer) {
                throw new Error('No file provided');
            }

            // ✅ First, check if bucket exists
            const { data: buckets, error: bucketError } = await supabase
                .storage
                .listBuckets();

            if (bucketError) {
                console.error('❌ Failed to list buckets:', bucketError);
                throw new Error('Storage service unavailable');
            }

            const issuesBucket = buckets.find(b => b.name === 'issues');
            if (!issuesBucket) {
                console.error('❌ "issues" bucket not found in Supabase Storage');
                throw new Error('Storage bucket "issues" not found. Please create it in Supabase dashboard.');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const fileExt = file.originalname.split('.').pop().toLowerCase();
            const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`;
            const filePath = `issue-photos/${fileName}`;

            console.log(`📤 Uploading image to Supabase Storage: ${filePath}`);
            console.log(`📦 Bucket: issues`);
            console.log(`👤 User ID: ${userId}`);

            // Upload to Supabase Storage bucket 'issues'
            const { data, error } = await supabase.storage
                .from('issues')  // Make sure this matches your bucket name exactly
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Supabase storage upload error:', error);
                
                // Handle specific error cases
                if (error.message.includes('bucket')) {
                    throw new Error('Storage bucket "issues" not found. Please create it in Supabase dashboard.');
                } else if (error.message.includes('permission')) {
                    throw new Error('Permission denied. Check your Supabase storage policies.');
                } else if (error.message.includes('duplicate')) {
                    throw new Error('A file with this name already exists. Please try again.');
                } else {
                    throw new Error(`Failed to upload image: ${error.message}`);
                }
            }

            console.log('✅ Image uploaded successfully:', data);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('issues')
                .getPublicUrl(filePath);

            console.log('🔗 Public URL:', publicUrl);
            
            return publicUrl;
        } catch (error) {
            console.error('❌ uploadImageToStorage error:', error);
            throw error;
        }
    }

    // ============ DASHBOARD STATS ============
    
    async getAdminDashboard() {
        const { data: stats, error: statsError } = await supabase
            .from('dashboard_summary')
            .select('*')
            .single();
        
        const { data: hotSpots, error: hotError } = await supabase
            .from('issues')
            .select('id, description, weight, location')
            .neq('status', 'resolved')
            .order('weight', { ascending: false })
            .limit(5);

        if (statsError || hotError) throw statsError || hotError;
        return { stats, hotSpots };
    }

    // ============ CITIZEN: CLUSTERING & REPORTING ============
    
    async getNearbyIssue(lat, lon) {
        const { data, error } = await supabase.rpc('check_nearby_pothole', { 
            lat: parseFloat(lat), lon: parseFloat(lon) 
        });
        if (error) throw error;
        return data?.[0] ? { nearbyFound: true, existingIssue: data[0] } : { nearbyFound: false };
    }

    async reportPothole(userId, formData, file) {
        try {
            const { lat, lon, description, isDuplicate, masterIssueId } = formData;
            
            if (!lat || !lon) throw new Error('Location coordinates are required');
            if (!description) throw new Error('Description is required');
            
            let photo_url = null;
            
            if (file) {
                photo_url = await this.uploadImageToStorage(file, userId);
            }

            if (isDuplicate === 'true' && masterIssueId) {
                await supabase.rpc('cast_secure_vote', { 
                    target_issue_id: masterIssueId, 
                    voting_user_id: userId, 
                    new_vote_value: 1 
                });
                
                // ✅ Recalculate weight for the merged issue
                await this.updateIssueWeight(masterIssueId);
                
                if (photo_url) {
                    await supabase.from('sub_reports').insert({ 
                        master_issue_id: masterIssueId, 
                        reporter_id: userId, 
                        photo_url,
                        comment: description 
                    });
                }
                
                return { 
                    status: 'merged', 
                    issueId: masterIssueId 
                };
            }
            
            // Create new issue with default weight 1
            const { data: newIssue, error } = await supabase
                .from('issues')
                .insert([{ 
                    location: `POINT(${lon} ${lat})`, 
                    description, 
                    status: 'pending', 
                    weight: 1,
                    created_at: new Date()
                }])
                .select()
                .single();
                
            if (error) throw error;
            
            // Add creator's vote (upvote)
            await supabase.from('votes').insert({ 
                user_id: userId, 
                issue_id: newIssue.id, 
                vote_value: 1 
            });
            
            // ✅ Calculate and set proper weight based on the vote
            const initialWeight = await this.updateIssueWeight(newIssue.id);
            
            if (photo_url) {
                await supabase.from('sub_reports').insert({ 
                    master_issue_id: newIssue.id, 
                    reporter_id: userId, 
                    photo_url,
                    comment: description,
                    created_at: new Date()
                });
            }
            
            return { 
                status: 'created', 
                issue: {
                    ...newIssue,
                    weight: initialWeight
                }
            };
            
        } catch (error) {
            console.error('❌ reportPothole error:', error);
            throw error;
        }
    }
    
    // ============ VOTING ============

    async castVote(issueId, userId, voteValue) {
        try {
            // Call the secure vote function
            const { data, error } = await supabase.rpc('cast_secure_vote_v2', { 
                target_issue_id: issueId, 
                voting_user_id: userId, 
                new_vote_value: voteValue 
            });
            
            if (error) throw error;
            
            // ✅ RECALCULATE AND UPDATE WEIGHT AFTER EVERY VOTE
            const newWeight = await this.updateIssueWeight(issueId);
            
            return { 
                result: data,
                new_weight: newWeight 
            };
        } catch (error) {
            console.error('❌ castVote error:', error);
            throw error;
        }
    }

    async getUserVotes(userId) {
        const { data, error } = await supabase
            .from('votes')
            .select('issue_id, vote_value')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
    }

    // ============ ISSUES WITH VOTES AND PHOTOS ============
        
    async getIssuesWithScores(filters = {}, page = 1, limit = 10) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            let query = supabase
                .from('issues')
                .select(`
                    *,
                    sub_reports (
                        id,
                        photo_url,
                        reporter_id,
                        created_at,
                        comment
                    )
                `);
            
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            
            const { data: issues, error: issuesError } = await query
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (issuesError) throw issuesError;
            
            if (!issues || issues.length === 0) {
                return [];
            }
            
            const issueIds = issues.map(issue => issue.id);
            
            const { data: votes, error: votesError } = await supabase
                .from('votes')
                .select('issue_id, vote_value')
                .in('issue_id', issueIds);
            
            if (votesError) throw votesError;
            
            const issuesWithDetails = issues.map(issue => {
                const issueVotes = votes.filter(v => v.issue_id === issue.id);
                const totalScore = issueVotes.reduce((sum, vote) => sum + vote.vote_value, 0);
                
                const subReports = issue.sub_reports || [];
                const photos = subReports
                    .map(report => report.photo_url)
                    .filter(url => url && url !== null && url !== '');
                
                return {
                    ...issue,
                    vote_score: totalScore,
                    total_votes: issueVotes.length,
                    photos: photos,
                    photo_count: photos.length,
                    first_photo: photos[0] || null
                };
            });
            
            return issuesWithDetails;
        } catch (error) {
            console.error('❌ getIssuesWithScores error:', error);
            throw error;
        }
    }

    async getIssueWithScore(issueId) {
        const { data: issue, error: issueError } = await supabase
            .from('issues')
            .select(`
                *,
                sub_reports (
                    id,
                    photo_url,
                    reporter_id,
                    created_at,
                    comment
                )
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
        
        const subReports = issue.sub_reports || [];
        const photos = subReports
            .map(report => report.photo_url)
            .filter(url => url && url !== null && url !== '');
        
        return {
            ...issue,
            vote_score: totalScore,
            total_votes: votes.length,
            voters: votes.map(v => v.user_id),
            photos: photos,
            photo_count: photos.length
        };
    }

    // ============ AMBULANCE CLAIM & RESOLVE ============
    
    async claimIssue(issueId, ambulanceId) {
        const { data, error } = await supabase
            .from('issues')
            .update({ 
                ambulance_id: ambulanceId, 
                status: 'assigned',
                assigned_at: new Date()
            })
            .eq('id', issueId)
            .eq('status', 'pending')
            .select();
        
        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error("This issue is no longer available or has already been claimed.");
        }

        await supabase
            .from('ambulance_units')
            .update({ is_available: false })
            .eq('driver_id', ambulanceId);
        
        return data[0];
    }

    // In IssueService.js - Update resolveIssue method
    async resolveIssue(issueId, ambulanceId, resolveData, file) {
        try {
            let resolution_photo_url = null;
            
            // Upload resolution photo if provided
            if (file) {
                resolution_photo_url = await this.uploadImageToStorage(file, ambulanceId);
            }
            
            const { data, error } = await supabase
                .from('issues')
                .update({ 
                    status: 'resolved', 
                    resolution_photo: resolution_photo_url || resolveData.photo_url, // Fallback
                    resolution_comment: resolveData.comment, 
                    resolved_at: new Date() 
                })
                .eq('id', issueId)
                .eq('ambulance_id', ambulanceId)
                .select();
            
            if (error) throw error;
            
            // Mark ambulance as available again
            await supabase
                .from('ambulance_units')
                .update({ is_available: true })
                .eq('driver_id', ambulanceId);
            
            return data[0];
        } catch (error) {
            console.error('❌ resolveIssue error:', error);
            throw error;
        }
    }

        // ============ VOTE-BASED PRIORITY CALCULATION ============

    /**
     * Calculate weight/priority based on vote score
     * Formula: base 1 + (votes * 0.5) + (time decay factor)
     * Max weight: 10, Min weight: 1
     */
    async calculateIssueWeight(issueId) {
        try {
            const { data: issue, error: issueError } = await supabase
                .from('issues')
                .select('created_at')
                .eq('id', issueId)
                .single();
                
            if (issueError) throw issueError;
            
            const { data: votes, error: votesError } = await supabase
                .from('votes')
                .select('vote_value')
                .eq('issue_id', issueId);
                
            if (votesError) throw votesError;
            
            const upvotes = votes.filter(v => v.vote_value === 1).length;
            const downvotes = votes.filter(v => v.vote_value === -1).length;
            
            const createdDate = new Date(issue.created_at);
            const now = new Date();
            const ageInHours = (now - createdDate) / (1000 * 60 * 60);
            
            // Integer-only calculation (returns 1-10)
            let weight = 1;
            
            // Each 2 upvotes = +1 priority
            weight += Math.floor(upvotes / 2);
            
            // Each 3 downvotes = -1 priority
            weight -= Math.floor(downvotes / 3);
            
            // Time bonus
            if (ageInHours < 6) weight += 2;
            else if (ageInHours < 24) weight += 1;
            else if (ageInHours > 72) weight -= 1;
            else if (ageInHours > 168) weight -= 2;
            
            // Cap between 1-10
            weight = Math.min(10, Math.max(1, weight));
            
            return weight;
        } catch (error) {
            console.error('❌ Error calculating weight:', error);
            return 1;
        }
    }

    /**
     * Update issue weight based on vote score
     */
    async updateIssueWeight(issueId) {
        try {
            // Calculate the new weight based on votes
            const newWeight = await this.calculateIssueWeight(issueId);
            
            // Update the database
            const { data, error } = await supabase
                .from('issues')
                .update({ 
                    weight: newWeight,
                    updated_at: new Date()
                })
                .eq('id', issueId)
                .select();
                
            if (error) throw error;
            
            console.log(`✅ Updated issue ${issueId} weight to ${newWeight}`);
            return newWeight;
        } catch (error) {
            console.error('❌ Error updating issue weight:', error);
            throw error;
        }
    }
    // ============ FEEDBACK SYSTEM ============

    /**
     * Submit citizen rating for resolved issue
     */
    async submitFeedback(issueId, citizenId, rating, afterPhotoUrl) {
        try {
            console.log("========== FEEDBACK SUBMISSION DEBUG ==========");
            console.log("1. Issue ID:", issueId);
            console.log("2. Citizen ID:", citizenId);
            
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

            if (issueError) {
                console.error("❌ Issue fetch error:", issueError);
                throw issueError;
            }
            
            console.log("3. Issue data:", issue);
            console.log("4. Ambulance ID from issue:", issue.ambulance_id);
            
            if (issue.status !== 'resolved') {
                throw new Error('Feedback can only be submitted for resolved issues');
            }

            if (!issue.ambulance_id) {
                throw new Error('No ambulance was assigned to this issue - cannot submit feedback');
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
            const feedbackData = {
                issue_id: issueId,
                citizen_id: citizenId,
                ambulance_id: issue.ambulance_id, // ← THIS MUST BE POPULATED
                after_photo_url: afterPhotoUrl,
                citizen_rating: rating,
                rdo_verified: false,
                created_at: new Date()
            };
            
            console.log("5. Feedback data to insert:", feedbackData);

            const { data: feedback, error: feedbackError } = await supabase
                .from('feedback')
                .insert([feedbackData])
                .select()
                .single();

            if (feedbackError) {
                console.error("❌ Feedback insert error:", feedbackError);
                throw feedbackError;
            }

            console.log("6. Feedback inserted successfully:", feedback);
            console.log("================================================");

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
    }

    /**
     * Update ambulance driver's average rating
     */
    async updateAmbulanceRating(ambulanceId) {
        try {
            // Get all feedback ratings for this ambulance
            const { data: feedbacks, error: feedbackError } = await supabase
                .from('feedback')
                .select(`
                    citizen_rating,
                    issues!inner (
                        ambulance_id
                    )
                `)
                .eq('issues.ambulance_id', ambulanceId);

            if (feedbackError) throw feedbackError;

            const validRatings = feedbacks
                .map(f => f.citizen_rating)
                .filter(r => r !== null && r >= 1 && r <= 5);

            const totalRatings = validRatings.length;
            let averageRating = 0;

            if (totalRatings > 0) {
                const sumRatings = validRatings.reduce((sum, r) => sum + r, 0);
                averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;
            }

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    average_rating: averageRating,
                    total_ratings: totalRatings
                })
                .eq('id', ambulanceId)
                .eq('role', 'ambulance');

            if (updateError) throw updateError;

            return { averageRating, totalRatings };
        } catch (error) {
            console.error('❌ updateAmbulanceRating error:', error);
            throw error;
        }
    }

    /**
     * RDO verify feedback (mark as official verification)
     */
    async verifyFeedback(feedbackId, rdoId) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .update({ 
                    rdo_verified: true,
                    verified_at: new Date(),
                    verified_by: rdoId
                })
                .eq('id', feedbackId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Feedback verified successfully',
                feedback: data
            };
        } catch (error) {
            console.error('❌ verifyFeedback error:', error);
            throw error;
        }
    }

    /**
     * Get feedback for a specific issue
     */
    async getIssueFeedback(issueId) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    citizen:citizen_id (
                        id,
                        full_name
                    )
                `)
                .eq('issue_id', issueId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ getIssueFeedback error:', error);
            throw error;
        }
    }

    /**
     * Get all feedback for an ambulance driver - SIMPLIFIED VERSION
     */
    async getAmbulanceFeedback(ambulanceId, page = 1, limit = 10) {
        try {
            console.log("📊 Fetching ambulance feedback for:", ambulanceId);
            
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            // SUPER SIMPLE - just get the feedback data, no joins
            const { data, error, count } = await supabase
                .from('feedback')
                .select('*', { count: 'exact' })
                .eq('ambulance_id', ambulanceId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('❌ Supabase error in getAmbulanceFeedback:', error);
                throw error;
            }

            console.log(`✅ Found ${data?.length || 0} feedback entries`);

            return {
                feedbacks: data || [],
                total: count || 0,
                page,
                limit
            };
        } catch (error) {
            console.error('❌ getAmbulanceFeedback error:', error);
            throw error;
        }
    }

    /**
     * Get ambulance driver's average rating - SIMPLIFIED VERSION
     */
    async getAmbulanceAverageRating(ambulanceId) {
        try {
            console.log("⭐ Fetching average rating for:", ambulanceId);
            
            const { data, error } = await supabase
                .from('feedback')
                .select('citizen_rating')
                .eq('ambulance_id', ambulanceId);

            if (error) {
                console.error('❌ Supabase error in getAmbulanceAverageRating:', error);
                throw error;
            }

            const ratings = data.map(f => f.citizen_rating).filter(r => r !== null);
            const totalRatings = ratings.length;
            let averageRating = 0;

            if (totalRatings > 0) {
                const sumRatings = ratings.reduce((sum, r) => sum + r, 0);
                averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;
            }

            console.log(`✅ Average rating: ${averageRating} from ${totalRatings} ratings`);

            return {
                average_rating: averageRating,
                total_ratings: totalRatings
            };
        } catch (error) {
            console.error('❌ getAmbulanceAverageRating error:', error);
            return { average_rating: 0, total_ratings: 0 };
        }
    }
    /**
     * Check if user can submit feedback for an issue
     */
    async canSubmitFeedback(issueId, citizenId) {
        try {
            const { data: issue, error: issueError } = await supabase
                .from('issues')
                .select('status, ambulance_id, resolution_photo')
                .eq('id', issueId)
                .single();

            if (issueError) throw issueError;

            if (issue.status !== 'resolved') {
                return { 
                    canSubmit: false, 
                    reason: 'Issue not resolved yet',
                    requires: 'resolved_status'
                };
            }

            if (!issue.resolution_photo) {
                return { 
                    canSubmit: false, 
                    reason: 'Resolution photo not available',
                    requires: 'resolution_photo'
                };
            }

            if (!issue.ambulance_id) {
                return {
                    canSubmit: false,
                    reason: 'No ambulance was assigned to this issue',
                    requires: 'ambulance_assigned'
                };
            }

            const { data: existingFeedback } = await supabase
                .from('feedback')
                .select('id')
                .eq('issue_id', issueId)
                .eq('citizen_id', citizenId)
                .maybeSingle();

            if (existingFeedback) {
                return { 
                    canSubmit: false, 
                    reason: 'You have already submitted feedback for this issue',
                    requires: 'already_submitted'
                };
            }

            return { 
                canSubmit: true, 
                ambulance_id: issue.ambulance_id, // ← Return this
                resolution_photo: issue.resolution_photo
            };
        } catch (error) {
            console.error('❌ canSubmitFeedback error:', error);
            throw error;
        }
    }

    /**
     * Get unverified feedback for RDO verification
     */
    async getUnverifiedFeedback(page = 1, limit = 20) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await supabase
                .from('feedback')
                .select(`
                    *,
                    issue:issue_id (
                        id,
                        description,
                        location,
                        created_at,
                        resolved_at,
                        resolution_photo
                    ),
                    citizen:citizen_id (
                        id,
                        full_name
                    ),
                    ambulance:issues!inner (
                        ambulance_id,
                        profiles!inner (
                            full_name,
                            vehicle_plate
                        )
                    )
                `, { count: 'exact' })
                .eq('rdo_verified', false)
                .order('created_at', { ascending: true })
                .range(from, to);

            if (error) throw error;

            return {
                feedbacks: data,
                total: count,
                page,
                limit
            };
        } catch (error) {
            console.error('❌ getUnverifiedFeedback error:', error);
            throw error;
        }
    }
}

// Create instance
const IssueService = new IssueServiceClass();

// ✅ EXPORT BOTH the service instance AND the upload middleware
module.exports = {
    IssueService,
    uploadMiddleware: upload
};