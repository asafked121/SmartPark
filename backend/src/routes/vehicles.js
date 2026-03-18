// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY vehicle_id',
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get vehicles error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { license_plate, make, model } = req.body;
    if (!license_plate || !make || !model) {
      return res.status(400).json({ error: 'License plate, make, and model are required' });
    }

    const result = await pool.query(
      'INSERT INTO vehicles (user_id, license_plate, make, model) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.user_id, license_plate.toUpperCase(), make, model]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'License plate already registered' });
    }
    console.error('Add vehicle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM vehicles WHERE vehicle_id = $1 AND user_id = $2 RETURNING *',
      [req.params.vehicleId, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle removed', vehicle: result.rows[0] });
  } catch (err) {
    console.error('Delete vehicle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
