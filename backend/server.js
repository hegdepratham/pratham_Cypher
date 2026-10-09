
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const db = require('./db');
const { seedIfEmpty } = require('./db/seed');

const dataRoutes = require('./routes/data');
const actionsRoutes = require('./routes/actions');
const agentRoutes = require('./routes/agent');

const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS for the frontend.
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins
  })
);

// Parse incoming JSON requests.
app.use(express.json());

// Ensure the database has demo data when starting with an empty database.
seedIfEmpty();

// Health check.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running'
  });
});

// API routes.
app.use('/api', dataRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/agent', agentRoutes);

// Handle unknown routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Error handler.
app.use((err, req, res, next) => {
  // Handle malformed JSON request bodies.
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    'body' in err
  ) {
    return res.status(400).json({
      error: 'Invalid JSON body'
    });
  }

  // Handle unexpected errors without exposing internal details.
  console.error(err);

  return res.status(500).json({
    error: 'Internal server error'
  });
});

// Start the server.
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
