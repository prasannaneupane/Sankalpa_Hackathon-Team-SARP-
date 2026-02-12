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
            
            await supabase.from('votes').insert({ 
                user_id: userId, 
                issue_id: newIssue.id, 
                vote_value: 1 
            });
            
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
                issue: newIssue 
            };
            
        } catch (error) {
            console.error('❌ reportPothole error:', error);
            throw error;
        }
    }

    // ============ VOTING ============
    
    async castVote(issueId, userId, voteValue) {
        const { data, error } = await supabase.rpc('cast_secure_vote_v2', { 
            target_issue_id: issueId, 
            voting_user_id: userId, 
            new_vote_value: voteValue 
        });
        if (error) throw error;
        return { result: data };
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

    async resolveIssue(issueId, ambulanceId, resolveData) {
        const { data, error } = await supabase
            .from('issues')
            .update({ 
                status: 'resolved', 
                resolution_photo: resolveData.photo_url, 
                resolution_comment: resolveData.comment, 
                resolved_at: new Date() 
            })
            .eq('id', issueId)
            .eq('ambulance_id', ambulanceId)
            .select();
        
        if (error) throw error;
        
        await supabase
            .from('ambulance_units')
            .update({ is_available: true })
            .eq('driver_id', ambulanceId);
        
        return data[0];
    }
}

// Create instance
const IssueService = new IssueServiceClass();

// ✅ EXPORT BOTH the service instance AND the upload middleware
module.exports = {
    IssueService,
    uploadMiddleware: upload
};