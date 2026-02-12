import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import MapComponent from "../components/MapComponent";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    resolved: 0,
    delayed: 0,
    average_priority: 0
  });
  
  // Ambulance management
  const [ambulances, setAmbulances] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [showCreateAmbulanceModal, setShowCreateAmbulanceModal] = useState(false);
  
  // New ambulance form
  const [newAmbulance, setNewAmbulance] = useState({
    full_name: "",
    email: "",
    password: "",
    vehicle_plate: "",
    vehicle_type: "basic",
    hospital: ""
  });

  const [focusedLocation, setFocusedLocation] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, issues, ambulances, citizens
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Check if user is admin
  useEffect(() => {
    if (user.role !== "admin") {
      navigate("/citizen/dashboard");
    }
  }, [user, navigate]);

  // ============ DASHBOARD STATS ============
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      
      if (data && data.stats) {
        setStats({
          total: data.stats.total_issues || 0,
          pending: data.stats.pending_count || 0,
          assigned: data.stats.assigned_count || 0,
          resolved: data.stats.resolved_count || 0,
          delayed: data.stats.delayed_count || 0,
          average_priority: data.stats.average_priority || 0
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // ============ ISSUES MANAGEMENT ============
  const fetchIssues = async () => {
    setLoading(true);
    try {
      // Use admin route for viewing issues
      const response = await fetch(`${API_BASE_URL}/admin/view-issues`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();
      
      const processedIssues = data.map(issue => ({
        ...issue,
        id: issue.id,
        _id: issue.id,
        lat: extractLatitude(issue.location),
        lng: extractLongitude(issue.location),
        priority: issue.weight || 1,
        status: formatStatus(issue.status),
        created_at: issue.created_at,
        assigned_to: issue.ambulance_id,
        votes: issue.vote_score || 0,
        photos: issue.photos || []
      }));
      
      setIssues(processedIssues);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

// In your fetch functions, add safe array handling:

    const fetchCitizens = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/view-citizens`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch citizens");
        }
        
        const data = await response.json();
        setCitizens(Array.isArray(data) ? data : []); // ✅ Ensure array
    } catch (err) {
        console.error("Error fetching citizens:", err);
        setCitizens([]); // ✅ Set empty array on error
    }
    };

    const fetchAmbulances = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/view-ambulances`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch ambulances");
        }
        
        const data = await response.json();
        setAmbulances(Array.isArray(data) ? data : []); // ✅ Ensure array
    } catch (err) {
        console.error("Error fetching ambulances:", err);
        setAmbulances([]); // ✅ Set empty array on error
    }
    };

  // ============ CREATE AMBULANCE ACCOUNT ============
  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    
    if (!newAmbulance.full_name || !newAmbulance.email || !newAmbulance.password || !newAmbulance.vehicle_plate) {
      alert("❌ Please fill all required fields");
      return;
    }

    if (newAmbulance.password.length < 6) {
      alert("❌ Password must be at least 6 characters");
      return;
    }

    try {
      // This endpoint is from auth routes, not admin routes
      const response = await fetch(`${API_BASE_URL}/auth/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newAmbulance.email.trim().toLowerCase(),
          password: newAmbulance.password,
          full_name: newAmbulance.full_name.trim(),
          role: "ambulance",
          vehicle_plate: newAmbulance.vehicle_plate.trim().toUpperCase(),
          vehicle_type: newAmbulance.vehicle_type,
          hospital: newAmbulance.hospital.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create ambulance account");
      }

      alert(`✅ Ambulance account created successfully!\n\nEmail: ${newAmbulance.email}\nPassword: ${newAmbulance.password}\nVehicle: ${newAmbulance.vehicle_plate}`);
      
      setNewAmbulance({
        full_name: "",
        email: "",
        password: "",
        vehicle_plate: "",
        vehicle_type: "basic",
        hospital: ""
      });
      setShowCreateAmbulanceModal(false);
      
      // Refresh ambulances list
      fetchAmbulances();
      
    } catch (err) {
      console.error("Error creating ambulance:", err);
      alert(`❌ ${err.message}`);
    }
  };

  // ============ TOGGLE AMBULANCE STATUS ============
  const handleToggleAmbulanceStatus = async (ambulanceId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this ambulance?`)) return;

    try {
      // You'll need to add this endpoint to your admin routes
      const response = await fetch(`${API_BASE_URL}/admin/ambulances/${ambulanceId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchAmbulances();
        alert(`✅ Ambulance ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      } else {
        alert("❌ Failed to update ambulance status");
      }
    } catch (err) {
      console.error("Error updating ambulance status:", err);
      alert("❌ Failed to update ambulance status");
    }
  };

  // ============ UTILITY FUNCTIONS ============
  const extractLatitude = (location) => {
    if (!location) return 27.7172;
    if (typeof location === 'string') {
      const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      return match ? parseFloat(match[2]) : 27.7172;
    }
    return 27.7172;
  };

  const extractLongitude = (location) => {
    if (!location) return 85.3240;
    if (typeof location === 'string') {
      const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      return match ? parseFloat(match[1]) : 85.3240;
    }
    return 85.3240;
  };

  const formatStatus = (status) => {
    switch (status) {
      case "pending": return "Open";
      case "assigned": return "In Progress";
      case "in_progress": return "In Progress";
      case "resolved": return "Completed";
      case "delayed": return "Delayed";
      default: return status || "Open";
    }
  };

  const getPriorityClass = (priority) => {
    if (priority >= 4) return "critical";
    if (priority >= 3) return "high";
    if (priority >= 2) return "medium";
    return "low";
  };

  // ============ FILTERS ============
  const getFilteredIssues = () => {
    return issues.filter(issue => {
      if (statusFilter !== "all") {
        if (statusFilter === "open" && issue.status !== "Open") return false;
        if (statusFilter === "progress" && issue.status !== "In Progress") return false;
        if (statusFilter === "completed" && issue.status !== "Completed") return false;
        if (statusFilter === "delayed" && issue.status !== "Delayed") return false;
      }

      if (priorityFilter !== "all") {
        const priority = issue.priority || 1;
        if (priorityFilter === "low" && priority > 1) return false;
        if (priorityFilter === "medium" && (priority < 2 || priority > 3)) return false;
        if (priorityFilter === "high" && priority < 3) return false;
        if (priorityFilter === "critical" && priority < 4) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          issue.id?.toLowerCase().includes(query) ||
          issue.description?.toLowerCase().includes(query) ||
          issue.location?.toString().toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  // ============ EXPORT ============
  const exportToCSV = () => {
    const filteredIssues = getFilteredIssues();
    
    const headers = ["ID", "Description", "Location", "Priority", "Status", "Created Date", "Votes", "Assigned To"];
    
    const csvData = filteredIssues.map(issue => [
      issue.id,
      issue.description || "No description",
      issue.location || "Unknown",
      issue.priority || 1,
      issue.status,
      new Date(issue.created_at).toLocaleDateString(),
      issue.votes || 0,
      issue.assigned_to || "Unassigned"
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ============ INITIAL FETCH ============
  useEffect(() => {
    fetchDashboardStats();
    fetchIssues();
    fetchAmbulances();
    fetchCitizens();
  }, []);

  const filteredIssues = getFilteredIssues();

  return (
    <div className="admin-dashboard">
      <Navbar loggedIn={true} />
      
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage system users and monitor road issues</p>
          </div>
          <div className="admin-actions">
            <button 
              className="create-ambulance-btn"
              onClick={() => setShowCreateAmbulanceModal(true)}
            >
              🚑 + Register Ambulance
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              📊 Export CSV
            </button>
            <button 
              className="refresh-btn" 
              onClick={() => {
                fetchDashboardStats();
                fetchIssues();
                fetchAmbulances();
                fetchCitizens();
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
            onClick={() => setActiveTab('issues')}
          >
            📋 Issues ({issues.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ambulances' ? 'active' : ''}`}
            onClick={() => setActiveTab('ambulances')}
          >
            🚑 Ambulances ({ambulances.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'citizens' ? 'active' : ''}`}
            onClick={() => setActiveTab('citizens')}
          >
            👥 Citizens ({citizens.length})
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <span className="stat-label">Total Issues</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
              </div>
              
              <div className="stat-card open">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <span className="stat-label">Open</span>
                  <span className="stat-value">{stats.pending}</span>
                </div>
              </div>
              
              <div className="stat-card progress">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <span className="stat-label">In Progress</span>
                  <span className="stat-value">{stats.assigned}</span>
                </div>
              </div>
              
              <div className="stat-card completed">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-label">Resolved</span>
                  <span className="stat-value">{stats.resolved}</span>
                </div>
              </div>
              
              <div className="stat-card delayed">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <span className="stat-label">Delayed</span>
                  <span className="stat-value">{stats.delayed}</span>
                </div>
              </div>
              
              <div className="stat-card ambulances">
                <div className="stat-icon">🚑</div>
                <div className="stat-info">
                  <span className="stat-label">Ambulances</span>
                  <span className="stat-value">{ambulances.length}</span>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="map-section">
              <h2 className="section-title">📍 Issue Locations</h2>
              <div className="map-container">
                <MapComponent 
                  issues={filteredIssues.slice(0, 50)} 
                  focusedLocation={focusedLocation}
                  height="400px"
                />
              </div>
            </div>

            {/* Recent Issues Preview */}
            <div className="recent-section">
              <div className="section-header">
                <h2 className="section-title">📋 Recent Issues</h2>
                <button 
                  className="view-all-btn"
                  onClick={() => setActiveTab('issues')}
                >
                  View All →
                </button>
              </div>
              <div className="recent-issues-grid">
                {filteredIssues.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="recent-issue-card">
                    <div className="recent-issue-header">
                      <span className={`priority-badge priority-${getPriorityClass(issue.priority)}`}>
                        P{issue.priority || 1}
                      </span>
                      <span className={`status-badge status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                        {issue.status}
                      </span>
                    </div>
                    <p className="recent-issue-description">
                      {issue.description?.substring(0, 60) || "No description"}
                      {issue.description?.length > 60 ? '...' : ''}
                    </p>
                    <div className="recent-issue-footer">
                      <span>📍 {issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}</span>
                      <span>📸 {issue.photos?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="issues-tab">
            <div className="section-header">
              <h2 className="section-title">📋 All Issues</h2>
              <div className="issue-filters">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>

                <select 
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low (1)</option>
                  <option value="medium">Medium (2-3)</option>
                  <option value="high">High (3-4)</option>
                  <option value="critical">Critical (4+)</option>
                </select>

                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-input"
                />

                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading issues...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Votes</th>
                      <th>Photos</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length > 0 ? (
                      filteredIssues.map((issue) => (
                        <tr 
                          key={issue.id} 
                          onClick={() => setFocusedLocation({ lat: issue.lat, lng: issue.lng })}
                          className="clickable-row"
                        >
                          <td className="issue-id">#{issue.id.substring(0, 6)}</td>
                          <td className="issue-description">
                            {issue.description?.substring(0, 50) || "No description"}
                            {issue.description?.length > 50 ? '...' : ''}
                          </td>
                          <td className="issue-location">
                            {issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}
                          </td>
                          <td>
                            <span className={`priority-badge priority-${getPriorityClass(issue.priority)}`}>
                              {issue.priority || 1}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                              {issue.status}
                            </span>
                          </td>
                          <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                          <td className={`vote-score ${issue.votes > 0 ? 'positive' : issue.votes < 0 ? 'negative' : ''}`}>
                            {issue.votes || 0}
                          </td>
                          <td>
                            {issue.photos?.length > 0 ? (
                              <button 
                                className="view-photos-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(issue.photos[0], '_blank');
                                }}
                              >
                                📸 {issue.photos.length}
                              </button>
                            ) : (
                              <span className="no-photos">No photos</span>
                            )}
                          </td>
                          <td>
                            {issue.assigned_to ? (
                              <span className="assigned-badge">
                                🚑 {issue.assigned_to.substring(0, 6)}
                              </span>
                            ) : (
                              <span className="unassigned-badge">Unassigned</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="no-data">
                          No issues found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AMBULANCES TAB */}
        {activeTab === 'ambulances' && (
          <div className="ambulances-tab">
            <div className="section-header">
              <h2 className="section-title">🚑 Registered Ambulances</h2>
              <button 
                className="add-ambulance-btn"
                onClick={() => setShowCreateAmbulanceModal(true)}
              >
                + Register New Ambulance
              </button>
            </div>

            <div className="ambulance-grid">
              {ambulances.length > 0 ? (
                ambulances.map((amb) => (
                  <div key={amb.id} className={`ambulance-card ${amb.is_active ? 'active' : 'inactive'}`}>
                    <div className="ambulance-header">
                      <span className="ambulance-icon">🚑</span>
                      <span className={`status-indicator ${amb.is_active ? 'active' : 'inactive'}`}>
                        {amb.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    
                    <div className="ambulance-details">
                      <h3 className="ambulance-name">{amb.full_name || amb.driver_name || 'Unknown'}</h3>
                      <p className="ambulance-email">{amb.email}</p>
                      <div className="ambulance-info">
                        <span className="info-tag">
                          <strong>Vehicle:</strong> {amb.vehicle_plate || 'N/A'}
                        </span>
                        <span className="info-tag">
                          <strong>Type:</strong> {amb.vehicle_type || 'Basic'}
                        </span>
                        {amb.hospital && (
                          <span className="info-tag">
                            <strong>Hospital:</strong> {amb.hospital}
                          </span>
                        )}
                      </div>
                      <p className="ambulance-stats">
                        <span>📍 {amb.assigned_issues || 0} assigned</span>
                        <span>✅ {amb.resolved_issues || 0} resolved</span>
                      </p>
                    </div>

                    <div className="ambulance-actions">
                      <button 
                        className="reset-password-btn"
                        onClick={() => alert('Reset password functionality - implement endpoint')}
                      >
                        🔑 Reset Password
                      </button>
                      <button 
                        className={`status-toggle-btn ${amb.is_active ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleAmbulanceStatus(amb.driver_id || amb.id, amb.is_active)}
                      >
                        {amb.is_active ? '❌ Deactivate' : '✅ Activate'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-ambulances">
                  <div className="no-ambulances-icon">🚑</div>
                  <h3>No Ambulances Registered</h3>
                  <p>Click the "Register Ambulance" button to create your first ambulance account.</p>
                  <button 
                    className="create-first-ambulance-btn"
                    onClick={() => setShowCreateAmbulanceModal(true)}
                  >
                    + Register Ambulance
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CITIZENS TAB */}
        {activeTab === 'citizens' && (
          <div className="citizens-tab">
            <div className="section-header">
              <h2 className="section-title">👥 Registered Citizens</h2>
              <span className="citizen-count">{citizens.length} total</span>
            </div>

            <div className="table-responsive">
              <table className="citizens-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Reports</th>
                    <th>Votes Cast</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {citizens.length > 0 ? (
                    citizens.map((citizen) => (
                      <tr key={citizen.id}>
                        <td className="citizen-id">#{citizen.id?.substring(0, 6)}</td>
                        <td className="citizen-name">{citizen.full_name || 'N/A'}</td>
                        <td className="citizen-email">{citizen.email}</td>
                        <td>{citizen.created_at ? new Date(citizen.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="citizen-reports">{citizen.report_count || 0}</td>
                        <td className="citizen-votes">{citizen.vote_count || 0}</td>
                        <td>
                          <span className="status-badge status-active">Active</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No citizens registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Ambulance Modal */}
      {showCreateAmbulanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">🚑 Register New Ambulance</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowCreateAmbulanceModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAmbulance}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Driver Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter driver's full name"
                    value={newAmbulance.full_name}
                    onChange={(e) => setNewAmbulance({...newAmbulance, full_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="driver@example.com"
                      value={newAmbulance.email}
                      onChange={(e) => setNewAmbulance({...newAmbulance, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newAmbulance.password}
                      onChange={(e) => setNewAmbulance({...newAmbulance, password: e.target.value})}
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Plate *</label>
                    <input
                      type="text"
                      placeholder="BA 1 PA 1234"
                      value={newAmbulance.vehicle_plate}
                      onChange={(e) => setNewAmbulance({...newAmbulance, vehicle_plate: e.target.value.toUpperCase()})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select
                      value={newAmbulance.vehicle_type}
                      onChange={(e) => setNewAmbulance({...newAmbulance, vehicle_type: e.target.value})}
                    >
                      <option value="basic">Basic Life Support</option>
                      <option value="advanced">Advanced Life Support</option>
                      <option value="icu">ICU Ambulance</option>
                      <option value="patient">Patient Transport</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Hospital/Station (Optional)</label>
                  <input
                    type="text"
                    placeholder="Associated hospital or station"
                    value={newAmbulance.hospital}
                    onChange={(e) => setNewAmbulance({...newAmbulance, hospital: e.target.value})}
                  />
                </div>

                <div className="form-info">
                  <span className="info-icon">ℹ️</span>
                  <span className="info-text">
                    Credentials will be shown once and must be shared with the ambulance driver.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowCreateAmbulanceModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="modal-confirm-btn"
                >
                  Create Ambulance Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;