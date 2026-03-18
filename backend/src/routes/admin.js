// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/occupancy', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pl.lot_id, pl.name, pl.total_capacity,
        COUNT(CASE WHEN r.status = 'active' AND r.start_time <= NOW() AND r.end_time >= NOW() 
              THEN 1 END) AS currently_occupied,
        pl.total_capacity - COUNT(CASE WHEN r.status = 'active' AND r.start_time <= NOW() AND r.end_time >= NOW() 
              THEN 1 END) AS currently_available
      FROM parking_lots pl
      LEFT JOIN reservations r ON pl.lot_id = r.lot_id
      GROUP BY pl.lot_id, pl.name, pl.total_capacity
      ORDER BY pl.lot_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get occupancy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/revenue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        pl.name AS lot_name,
        COUNT(p.payment_id) AS total_transactions,
        COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN p.payment_status = 'pending' THEN p.amount ELSE 0 END), 0) AS pending_revenue
      FROM parking_lots pl
      LEFT JOIN reservations r ON pl.lot_id = r.lot_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      GROUP BY pl.lot_id, pl.name
      ORDER BY pl.lot_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get revenue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reservations', async (req, res) => {
  try {
    const { status, lot_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.email, v.license_plate, v.make, v.model,
        pl.name AS lot_name, p.amount, p.payment_status, p.payment_id
      FROM reservations r
      JOIN users u ON r.user_id = u.user_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_lots pl ON r.lot_id = pl.lot_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (status) {
      query += ` AND r.status = $${i++}`;
      params.push(status);
    }
    if (lot_id && !isNaN(parseInt(lot_id))) {
      query += ` AND r.lot_id = $${i++}`;
      params.push(parseInt(lot_id));
    }
    query += ` ORDER BY r.start_time DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get all reservations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
