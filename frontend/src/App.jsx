// App.jsx - NO BrowserRouter here!
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterCitizen from './pages/Register_citizen';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReportIssue from './pages/ReportIssue';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import MissionView from './pages/MissionView';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  console.log('🔒 ProtectedRoute - Path:', window.location.pathname, 'Role:', role, 'Token:', !!token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'ambulance') return <Navigate to="/ambulance/dashboard" replace />;
    return <Navigate to="/citizen-dashboard" replace />;
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
      
      {/* Citizen Routes */}
      <Route path="/citizen-dashboard" element={
        <ProtectedRoute allowedRoles={['citizen']}>
          <CitizenDashboard />
        </ProtectedRoute>
      } />
      <Route path="/report" element={
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
      <Route path="/ambulance/dashboard" element={
        <ProtectedRoute allowedRoles={['ambulance']}>
          <AmbulanceDashboard />
        </ProtectedRoute>
      } />
      <Route path="/mission/:id" element={
        <ProtectedRoute allowedRoles={['ambulance']}>
          <MissionView />
        </ProtectedRoute>
      } />
      
      {/* Redirects */}
      <Route path="/citizen/dashboard" element={<Navigate to="/citizen-dashboard"  />} />
      <Route path="/report-issue" element={<Navigate to="/report"  />} />
      
    </Routes>
  );
}

export default App;