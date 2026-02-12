const express = require('express');
const app = express();
const cors = require('cors');

// ✅ ADD CORS MIDDLEWARE HERE - BEFORE OTHER MIDDLEWARE AND ROUTES
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  optionsSuccessStatus: 200
}));

// Global Middlewares
app.use(express.json()); // Parses incoming JSON requests

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import Route Files
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');


// Mounting Routes to URL Paths
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 Handler for undefined routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Pothole Ambulance API running on port ${PORT}`));