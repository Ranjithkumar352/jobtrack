'use strict';

require('dotenv').config();

// Validate required environment variables before anything else
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is required');
  process.exit(1);
}

const express            = require('express');
const cors               = require('cors');
const connectDB          = require('./config/db');
const errorHandler       = require('./middleware/errorHandler');
const applicationRoutes  = require('./routes/applicationRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', function (req, res) {
  res.json({ status: 'ok' });
});

app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard',    dashboardRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use(function (req, res) {
  res.status(404).json({ error: 'Not found' });
});

// ── Centralized error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(function () {
      app.listen(PORT, function () {
        console.log('JobTrack server listening on port ' + PORT);
      });
    })
    .catch(function (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;
