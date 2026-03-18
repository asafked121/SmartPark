// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const handleValidation = require('../middleware/validate');
const { RATE_PER_HOUR } = require('../config');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT r.*, v.license_plate, v.make, v.model, pl.name AS lot_name,
        p.payment_id, p.amount, p.payment_status
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_lots pl ON r.lot_id = pl.lot_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      WHERE r.user_id = $1
      ORDER BY r.start_time DESC
      LIMIT $2 OFFSET $3
    `, [req.user.user_id, limit, offset]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get reservations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, [
  body('vehicle_id').isInt({ min: 1 }).withMessage('Valid vehicle is required'),
  body('lot_id').isInt({ min: 1 }).withMessage('Valid lot is required'),
  body('slot_number').notEmpty().withMessage('Slot number is required'),
  body('start_time').isISO8601().withMessage('Valid start time is required'),
  body('end_time').isISO8601().withMessage('Valid end time is required'),
  handleValidation,
], async (req, res) => {
  const client = await pool.connect();
  try {
    const { vehicle_id, lot_id, slot_number, start_time, end_time } = req.body;

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Start time must be in the future' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    await client.query('BEGIN');

    const vehicleCheck = await client.query(
      'SELECT * FROM vehicles WHERE vehicle_id = $1 AND user_id = $2',
      [vehicle_id, req.user.user_id]
    );
    if (vehicleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Vehicle does not belong to user' });
    }

    const overlapCheck = await client.query(`
      SELECT reservation_id FROM reservations
      WHERE lot_id = $1 AND slot_number = $2 AND status = 'active'
        AND start_time < $4 AND end_time > $3
    `, [lot_id, slot_number, start_time, end_time]);

    if (overlapCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot is already reserved for this time period' });
    }

    const reservationResult = await client.query(`
      INSERT INTO reservations (user_id, vehicle_id, lot_id, slot_number, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `, [req.user.user_id, vehicle_id, lot_id, slot_number, start_time, end_time]);

    const reservation = reservationResult.rows[0];

    const hours = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60)
    );
    const amount = (hours * RATE_PER_HOUR).toFixed(2);

    const paymentResult = await client.query(`
      INSERT INTO payments (reservation_id, amount, payment_status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [reservation.reservation_id, amount]);

    await client.query('COMMIT');

    res.status(201).json({
      reservation,
      payment: paymentResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Double-booking prevented by database constraint' });
    }
    console.error('Create reservation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.patch('/:reservationId/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE reservations SET status = 'cancelled'
      WHERE reservation_id = $1 AND user_id = $2 AND status = 'active'
      RETURNING *
    `, [req.params.reservationId, req.user.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active reservation not found' });
    }

    await pool.query(`
      UPDATE payments SET payment_status = 'failed'
      WHERE reservation_id = $1 AND payment_status = 'pending'
    `, [req.params.reservationId]);

    res.json({ message: 'Reservation cancelled', reservation: result.rows[0] });
  } catch (err) {
    console.error('Cancel reservation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
