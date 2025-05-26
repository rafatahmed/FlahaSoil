const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/v1/soil', require('./src/routes/soil'));
app.use('/api/v1/auth', require('./src/routes/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'FlahaSoil API' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FlahaSoil API running on port ${PORT}`);
});