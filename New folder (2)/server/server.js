require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Configure CORS to allow requests from the frontend origin
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

// Set up JSON body parser middleware
app.use(express.json());

// Import and mount API routes from routes/api.js at /api path
const apiRoutes = require('./routes/api.js');
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server on configured PORT (default 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nibras AI Server by seven_code7 studio - Running on port ${PORT}`);
});