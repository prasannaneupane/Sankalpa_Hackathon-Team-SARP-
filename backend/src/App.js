const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: "Pothole Ambulance API is live! 🚑" });
});

// Future Routes will be imported here:
// const issueRoutes = require('./routes/issueRoutes');
// app.use('/api/issues', issueRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});