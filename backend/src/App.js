const express = require('express');
const app = express();

// Import Route Files
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Global Middlewares
app.use(express.json()); // Parses incoming JSON requests

// Mounting Routes to URL Paths
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 Handler for undefined routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Pothole Ambulance API running on port ${PORT}`));