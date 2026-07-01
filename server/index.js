require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const { initializeDatabase } = require('./config/initDb');
const { setPool } = require('./config/db');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const itemsRoutes = require('./routes/items');
const billsRoutes = require('./routes/bills');
const fpGrowthRoutes = require('./routes/fpGrowth');

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'smartbasket-dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.get('/', (_req, res) => {
  res.json({
    message: 'SmartBasket Analytics API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      items: '/api/items',
      bills: '/api/bills',
      dashboard: '/api/dashboard',
      fpGrowth: '/api/fp-growth',
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/fp-growth', fpGrowthRoutes);

async function startServer() {
  try {
    const pool = await initializeDatabase();
    setPool(pool);

    app.listen(PORT, () => {
      console.log(`SmartBasket Analytics server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
