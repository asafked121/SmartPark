// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const express = require('express');
const cors = require('cors');
const seed = require('./seed');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const lotRoutes = require('./routes/lots');
const reservationRoutes = require('./routes/reservations');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`SmartPark API running on port ${PORT}`);
  await seed();
});
