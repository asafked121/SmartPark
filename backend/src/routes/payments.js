const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, r.lot_id, r.slot_number, r.start_time, r.end_time,
        pl.name AS lot_name
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.reservation_id
      JOIN parking_lots pl ON r.lot_id = pl.lot_id
      WHERE r.user_id = $1
      ORDER BY p.payment_date DESC
    `, [req.user.user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:paymentId/pay', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE payments SET payment_status = 'paid', payment_date = NOW()
      WHERE payment_id = $1 AND payment_status = 'pending'
        AND reservation_id IN (
          SELECT reservation_id FROM reservations WHERE user_id = $2
        )
      RETURNING *
    `, [req.params.paymentId, req.user.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending payment not found' });
    }

    res.json({ message: 'Payment processed', payment: result.rows[0] });
  } catch (err) {
    console.error('Process payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
