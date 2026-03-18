const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const { RATE_PER_HOUR } = require('./config');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const lotRoutes = require('./routes/lots');
const reservationRoutes = require('./routes/reservations');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts, please try again in 15 minutes' },
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/config', (req, res) => {
  res.json({ rate_per_hour: RATE_PER_HOUR });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
