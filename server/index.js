require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { setSocketIO } = require('./utils/notifications');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Pass io to notification system
setSocketIO(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user-specific room for targeted notifications
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined notification room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static files (for uploaded files, CoA PDFs, etc.)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const clientRoutes = require('./routes/client.routes');
const testMasterRoutes = require('./routes/testMaster.routes');
const standardRoutes = require('./routes/standard.routes');
const productTypeRoutes = require('./routes/productType.routes');
const sampleRoutes = require('./routes/sample.routes');
const bookingRoutes = require('./routes/booking.routes');
const resultRoutes = require('./routes/result.routes');
const reviewRoutes = require('./routes/review.routes');
const coaRoutes = require('./routes/coa.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const notificationRoutes = require('./routes/notification.routes');
const instrumentRoutes = require('./routes/instrument.routes');
const rateMasterRoutes = require('./routes/rateMaster.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const locationRoutes = require('./routes/location.routes');
const sampleTransferRoutes = require('./routes/sampleTransfer.routes');
const bookingKpiRoutes = require('./routes/bookingKpi.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/test-masters', testMasterRoutes);
app.use('/api/standards', standardRoutes);
app.use('/api/product-types', productTypeRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coa', coaRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/rate-masters', rateMasterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sample-transfers', sampleTransferRoutes);
app.use('/api/booking-kpi', bookingKpiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Database sync & server start
const PORT = process.env.PORT || 5000;
const db = require('./models');

db.sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    // Use sync without alter for SQLite (already seeded via seed.js)
    return db.sequelize.sync();
  })
  .then(() => {
    console.log('Database synced.');
    server.listen(PORT, () => {
      console.log(`LIMS Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });

module.exports = { app, server, io };
