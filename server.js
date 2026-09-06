require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route modules - one per resource, grouped by module as per the project spec.
const authRoutes = require('./routes/authRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const itemRoutes = require('./routes/itemRoutes');
const stockRoutes = require('./routes/stockRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const transferRoutes = require('./routes/transferRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const movementRoutes = require('./routes/movementRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// --- Core middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Health check (useful for confirming the server + DB are up before a demo) ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running', data: { uptime: process.uptime() } });
});

// --- Mounted routes ---
app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/items', itemRoutes);           // includes GET /api/items/low-stock (Module 9)
app.use('/api/stock', stockRoutes);          // POST /api/stock/in, POST /api/stock/out
app.use('/api/balances', balanceRoutes);     // GET /api/balances (Module 6 read side)
app.use('/api/transfers', transferRoutes);   // Modules 7 & 8
app.use('/api/adjustments', adjustmentRoutes); // Module 10
app.use('/api/movements', movementRoutes);   // Module 11
app.use('/api/admin/reports', reportRoutes); // Module 12

// --- 404 + centralized error handler (must be registered LAST) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Guard rails so unexpected errors produce a log instead of a silent crash / hang.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Warehouse Inventory API running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
