// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pl.*, 
        (SELECT COUNT(*) FROM parking_slots ps WHERE ps.lot_id = pl.lot_id) AS slot_count
      FROM parking_lots pl 
      ORDER BY pl.lot_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get lots error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:lotId', authenticateToken, async (req, res) => {
  try {
    const lotResult = await pool.query(
      'SELECT * FROM parking_lots WHERE lot_id = $1',
      [req.params.lotId]
    );

    if (lotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    res.json(lotResult.rows[0]);
  } catch (err) {
    console.error('Get lot error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:lotId/slots', authenticateToken, async (req, res) => {
  try {
    const { start_time, end_time } = req.query;

    let slotsResult;
    if (start_time && end_time) {
      // Return slots with availability status for the requested time range
      slotsResult = await pool.query(`
        SELECT ps.*,
          CASE WHEN EXISTS (
            SELECT 1 FROM reservations r
            WHERE r.lot_id = ps.lot_id 
              AND r.slot_number = ps.slot_number
              AND r.status = 'active'
              AND r.start_time < $3
              AND r.end_time > $2
          ) THEN 'reserved'
          ELSE 'available'
          END AS availability_status
        FROM parking_slots ps
        WHERE ps.lot_id = $1
        ORDER BY ps.floor_level, ps.slot_number
      `, [req.params.lotId, start_time, end_time]);
    } else {
      // Return slots with current reservation status
      slotsResult = await pool.query(`
        SELECT ps.*,
          CASE WHEN EXISTS (
            SELECT 1 FROM reservations r
            WHERE r.lot_id = ps.lot_id 
              AND r.slot_number = ps.slot_number
              AND r.status = 'active'
              AND r.start_time <= NOW()
              AND r.end_time >= NOW()
          ) THEN 'occupied'
          ELSE 'available'
          END AS availability_status
        FROM parking_slots ps
        WHERE ps.lot_id = $1
        ORDER BY ps.floor_level, ps.slot_number
      `, [req.params.lotId]);
    }

    res.json(slotsResult.rows);
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
