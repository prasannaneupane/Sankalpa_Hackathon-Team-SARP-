// App.jsx - NO BrowserRouter here!
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterCitizen from './pages/Register_citizen';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
//import AmbulanceDashboard from './pages/AmbulanceDashboard';
import ReportIssue from './pages/ReportIssue';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  console.log('🔒 ProtectedRoute - Path:', window.location.pathname, 'Role:', role, 'Token:', !!token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    //if (role === 'ambulance') return <Navigate to="/ambulance/dashboard" replace />;
    return <Navigate to="/citizen-dashboard" replace />; // ← FIXED: Changed from /citizen/dashboard
  }
  
  return children;
};

function App() {
  return (
    <Routes>  
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register_citizen" element={<RegisterCitizen />} />
      
      {/* Citizen Routes - MUST match Navbar paths */}
      <Route path="/citizen-dashboard" element={   // ← FIXED: Changed from /citizen/dashboard
        <ProtectedRoute allowedRoles={['citizen']}>
          <CitizenDashboard />
        </ProtectedRoute>
      } />
      <Route path="/report" element={   // ← FIXED: Changed from /report-issue
        <ProtectedRoute allowedRoles={['citizen']}>
          <ReportIssue />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Ambulance Routes */}
      {/* <Route path="/ambulance/dashboard" element={
        <ProtectedRoute allowedRoles={['ambulance']}>
          <AmbulanceDashboard />
        </ProtectedRoute>
      } />  */}
      
      {/* Redirect from old paths to new paths (for backward compatibility) */}
      <Route path="/citizen/dashboard" element={<Navigate to="/citizen-dashboard"  />} />
      <Route path="/report-issue" element={<Navigate to="/report"  />} />
      <Route path="/citizen-dashboard" element={<Navigate to="/citizen-dashboard"  />} /> {/* Prevent loop */}
    </Routes>
  );
}

export default App;