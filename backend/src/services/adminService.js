const supabase = require('../config/db');

class AdminService {
  
  // ============ CITIZEN MANAGEMENT ============
  
  async getAllCitizens() {
    try {
      // Get profiles with role = 'citizen'
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          created_at,
          is_verified,
          reputation_score
        `)
        .eq('role', 'citizen')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get emails and stats for each citizen
      const citizens = await Promise.all((profiles || []).map(async (citizen) => {
        // Get email from auth.users
        let email = 'N/A';
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(citizen.id);
          if (!userError && userData?.user) {
            email = userData.user.email;
          }
        } catch (e) {
          console.error(`Error fetching email for user ${citizen.id}:`, e);
        }

        // Get report count
        const { count: reportCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('reporter_id', citizen.id);

        // Get vote count
        const { count: voteCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', citizen.id);

        return {
          id: citizen.id,
          full_name: citizen.full_name || 'N/A',
          email: email,
          created_at: citizen.created_at,
          report_count: reportCount || 0,
          vote_count: voteCount || 0,
          is_verified: citizen.is_verified || false,
          reputation_score: citizen.reputation_score || 0
        };
      }));

      return citizens;
    } catch (error) {
      console.error("❌ AdminService.getAllCitizens error:", error);
      throw error;
    }
  }

  // ============ AMBULANCE MANAGEMENT ============
  
  async getAllAmbulances() {
    try {
      // Get profiles with role = 'ambulance'
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          created_at,
          is_verified
        `)
        .eq('role', 'ambulance')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get emails and ambulance units for each ambulance
      const ambulances = await Promise.all((profiles || []).map(async (amb) => {
        // Get email from auth.users
        let email = 'N/A';
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(amb.id);
          if (!userError && userData?.user) {
            email = userData.user.email;
          }
        } catch (e) {
          console.error(`Error fetching email for user ${amb.id}:`, e);
        }

        // Get ambulance unit details
        const { data: unitData } = await supabase
          .from('ambulance_units')
          .select('*')
          .eq('driver_id', amb.id)
          .maybeSingle();

        // Get assigned issues count
        const { count: assignedCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('ambulance_id', amb.id)
          .neq('status', 'resolved');

        // Get resolved issues count
        const { count: resolvedCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('ambulance_id', amb.id)
          .eq('status', 'resolved');

        return {
          id: amb.id,
          driver_id: amb.id,
          driver_name: amb.full_name || 'Unknown',
          full_name: amb.full_name || 'Unknown',
          email: email,
          created_at: amb.created_at,
          vehicle_plate: unitData?.vehicle_plate || 'N/A',
          vehicle_type: unitData?.vehicle_type || 'basic',
          hospital: unitData?.hospital || null,
          is_available: unitData?.is_available || false,
          is_active: amb.is_verified || false,
          assigned_issues: assignedCount || 0,
          resolved_issues: resolvedCount || 0
        };
      }));

      return ambulances;
    } catch (error) {
      console.error("❌ AdminService.getAllAmbulances error:", error);
      throw error;
    }
  }

  // ============ CREATE AMBULANCE ACCOUNT ============
  
  async createAmbulanceAccount(userData) {
    try {
      const { full_name, email, password, vehicle_plate, vehicle_type, hospital } = userData;

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: 'ambulance' }
      });

      if (authError) throw new Error(`Auth Error: ${authError.message}`);

      // 2. Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name,
          role: 'ambulance',
          is_verified: true,
          reputation_score: 100
        }])
        .select()
        .single();

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile Error: ${profileError.message}`);
      }

      // 3. Create ambulance unit
      const { error: unitError } = await supabase
        .from('ambulance_units')
        .insert([{
          driver_id: profile.id,
          vehicle_plate: vehicle_plate.toUpperCase(),
          vehicle_type,
          hospital,
          is_available: true
        }]);

      if (unitError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Ambulance Unit Error: ${unitError.message}`);
      }

      return {
        success: true,
        message: "Ambulance account created successfully",
        user: {
          id: profile.id,
          email,
          full_name,
          vehicle_plate
        }
      };
    } catch (error) {
      console.error("❌ AdminService.createAmbulanceAccount error:", error);
      throw error;
    }
  }

  // ============ TOGGLE AMBULANCE STATUS ============
  
  async toggleAmbulanceStatus(ambulanceId, isActive) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: isActive })
        .eq('id', ambulanceId)
        .eq('role', 'ambulance')
        .select();

      if (error) throw error;

      return {
        success: true,
        message: `Ambulance ${isActive ? 'activated' : 'deactivated'} successfully`,
        data
      };
    } catch (error) {
      console.error("❌ AdminService.toggleAmbulanceStatus error:", error);
      throw error;
    }
  }

  // ============ RESET AMBULANCE PASSWORD ============
  
  async resetAmbulancePassword(ambulanceId, newPassword) {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(ambulanceId, {
        password: newPassword
      });

      if (error) throw error;

      return {
        success: true,
        message: "Password reset successfully"
      };
    } catch (error) {
      console.error("❌ AdminService.resetAmbulancePassword error:", error);
      throw error;
    }
  }

  // ============ DASHBOARD STATISTICS ============
  
  async getDashboardStats() {
    try {
      // Get total counts
      const { count: totalCitizens } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'citizen');

      const { count: totalAmbulances } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ambulance');

      const { count: totalIssues } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true });

      const { count: pendingIssues } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: resolvedIssues } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      return {
        total_citizens: totalCitizens || 0,
        total_ambulances: totalAmbulances || 0,
        total_issues: totalIssues || 0,
        pending_issues: pendingIssues || 0,
        resolved_issues: resolvedIssues || 0
      };
    } catch (error) {
      console.error("❌ AdminService.getDashboardStats error:", error);
      throw error;
    }
  }

  // ============ DELETE ISSUE ============
  
  async deleteIssue(issueId) {
    try {
      // Delete related votes
      await supabase.from('votes').delete().eq('issue_id', issueId);
      
      // Delete related sub_reports
      await supabase.from('sub_reports').delete().eq('master_issue_id', issueId);
      
      // Delete the issue
      const { data, error } = await supabase
        .from('issues')
        .delete()
        .eq('id', issueId)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: "Issue deleted successfully",
        data
      };
    } catch (error) {
      console.error("❌ AdminService.deleteIssue error:", error);
      throw error;
    }
  }
}

module.exports = new AdminService();