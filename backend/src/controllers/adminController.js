const supabase = require('../config/db');
const AdminService = require('../services/adminService');
const { IssueService } = require('../services/issueService');

// Get all citizens
exports.getCitizens = async (req, res) => {
  try {
    const citizens = await AdminService.getAllCitizens();
    res.json(citizens);
  } catch (err) {
    console.error("❌ Error in getCitizens controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all ambulances
exports.getAmbulances = async (req, res) => {
  try {
    const ambulances = await AdminService.getAllAmbulances();
    res.json(ambulances);
  } catch (err) {
    console.error("❌ Error in getAmbulances controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all issues for admin
exports.getIssues = async (req, res) => {
  try {
    // Reuse IssueService for consistency
    const issues = await IssueService.getIssuesWithScores({}, 1, 100);
    
    // Format issues for admin view
    const formattedIssues = (issues || []).map(issue => ({
      ...issue,
      _id: issue.id,
      lat: extractLatitude(issue.location),
      lng: extractLongitude(issue.location),
      assigned_to: issue.ambulance_id,
      created_at: issue.created_at,
      priority: issue.weight || 1,
      status: formatStatus(issue.status)
    }));
    
    res.json(formattedIssues);
  } catch (err) {
    console.error("❌ Error in getIssues controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await AdminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error("❌ Error in getDashboardStats controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create new ambulance account
exports.createAmbulance = async (req, res) => {
  try {
    const { full_name, email, password, vehicle_plate, vehicle_type, hospital } = req.body;
    
    // Validation
    if (!full_name || !email || !password || !vehicle_plate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await AdminService.createAmbulanceAccount({
      full_name,
      email,
      password,
      vehicle_plate,
      vehicle_type: vehicle_type || 'basic',
      hospital: hospital || null
    });
    
    res.status(201).json(result);
  } catch (err) {
    console.error("❌ Error in createAmbulance controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Toggle ambulance active status
exports.toggleAmbulanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const result = await AdminService.toggleAmbulanceStatus(id, is_active);
    res.json(result);
  } catch (err) {
    console.error("❌ Error in toggleAmbulanceStatus controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reset ambulance password
exports.resetAmbulancePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    const result = await AdminService.resetAmbulancePassword(id, password);
    res.json(result);
  } catch (err) {
    console.error("❌ Error in resetAmbulancePassword controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete issue
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteIssue(id);
    res.json(result);
  } catch (err) {
    console.error("❌ Error in deleteIssue controller:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============ HELPER FUNCTIONS ============

const extractLatitude = (location) => {
  if (!location) return 27.7172;
  if (typeof location === 'string') {
    try {
      const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) return parseFloat(match[2]);
    } catch (e) {}
  }
  if (location?.coordinates) return location.coordinates[1] || 27.7172;
  return 27.7172;
};

const extractLongitude = (location) => {
  if (!location) return 85.3240;
  if (typeof location === 'string') {
    try {
      const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) return parseFloat(match[1]);
    } catch (e) {}
  }
  if (location?.coordinates) return location.coordinates[0] || 85.3240;
  return 85.3240;
};

const formatStatus = (status) => {
  if (!status) return "Open";
  switch (status.toLowerCase()) {
    case "pending": return "Open";
    case "assigned": return "In Progress";
    case "in_progress": return "In Progress";
    case "resolved": return "Completed";
    case "delayed": return "Delayed";
    default: return status;
  }
};