import express from 'express';
import { query } from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/system/settings
// Returns public system settings like interest rates and fees
router.get('/settings', protect, async (req, res, next) => {
  try {
    const result = await query('SELECT setting_key, setting_value, description FROM system_settings');
    
    // Convert to a more usable object format: { key: value }
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = parseFloat(row.setting_value);
    });

    res.json({
      success: true,
      settings,
      raw: result.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
