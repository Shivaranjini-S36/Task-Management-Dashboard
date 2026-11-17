require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getStatus } = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (vital for GitHub Pages -> Render API)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from both root and public directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const db = getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TaskFlow API Server',
    database: {
      status: db.connected ? 'Connected to MongoDB Atlas' : 'Local Fallback Storage Active',
      connected: db.connected,
      host: db.host,
      databaseName: db.dbName,
      collection: 'tasks'
    },
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/tasks', taskRoutes);

// Root route fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for unknown API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Connect to MongoDB Atlas and start server when run directly
if (require.main === module) {
  (async () => {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 TaskFlow Server running at: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📋 API Tasks:    http://localhost:${PORT}/api/tasks`);
      console.log(`=======================================================`);
    });
  })();
}

module.exports = app;
