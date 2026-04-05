import db from '../config/database.js';

// Saves a new contact number or agent to the user's personal favorites list
export const addFavorite = async (req, res) => {
  const userId = req.user.userId;
  const { type, phone, name } = req.body;

  if (!type || !phone || !name) {
    return res.status(400).json({ success: false, message: 'Type, phone, and name are required' });
  }

  if (!['number', 'agent'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid favorite type' });
  }

  try {
    // Check if limit exceeded (5 for number, 2 for agent)
    const limitResult = await db.query(
      `SELECT COUNT(*) as count FROM favorites WHERE user_id = $1 AND type = $2`,
      [userId, type]
    );
    const count = parseInt(limitResult.rows[0].count, 10);

    if (type === 'number') {
      if (count >= 5) {
        return res.status(400).json({ success: false, message: 'You can save up to 5 contact numbers only.' });
      }
    }
    if (type === 'agent' && count >= 2) {
      return res.status(400).json({ success: false, message: 'You can add up to 2 favorite agents only.' });
    }

    // Insert with is_favorite default false
    const result = await db.query(
      `INSERT INTO favorites (user_id, type, phone, name) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, type, phone, name]
    );

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      favorite: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ success: false, message: 'This favorite is already added.' });
    }
    console.error('Error adding favorite:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Retrieves the complete list of saved favorites for the authenticated user
export const getFavorites = async (req, res) => {
  const userId = req.user.userId;
  const { type } = req.query;

  try {
    let query = `SELECT id, type, phone, name, is_favorite FROM favorites WHERE user_id = $1`;
    const params = [userId];

    if (type) {
      query += ` AND type = $2`;
      params.push(type);
    }
    query += ` ORDER BY created_at ASC`;

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error getting favorites:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggles the pinned favorite status for a specific contact or agent
export const toggleFavorite = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    // Check current state of this favorite
    const favResult = await db.query(
      `SELECT * FROM favorites WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (favResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    const currentFav = favResult.rows[0];
    const isCurrentlyFavorite = currentFav.is_favorite;
    const newFavoriteState = !isCurrentlyFavorite;

    if (newFavoriteState && currentFav.type === 'number') {
      // Trying to mark as favorite, check limits
      // 1. Max 2 active favorites
      const activeFavsResult = await db.query(
        `SELECT COUNT(*) as count FROM favorites WHERE user_id = $1 AND type = 'number' AND is_favorite = true`,
        [userId]
      );
      const activeCount = parseInt(activeFavsResult.rows[0].count, 10);
      
      if (activeCount >= 2) {
        return res.status(400).json({ success: false, message: 'You can only have 2 active favorite numbers.' });
      }

      // 2. Check monthly limit: only 2 can be marked favorite in one month
      const markedThisMonthResult = await db.query(
        `SELECT COUNT(*) as count FROM favorites 
         WHERE user_id = $1 AND type = 'number' AND is_favorite = true 
         AND date_trunc('month', marked_favorite_at) = date_trunc('month', CURRENT_DATE)`,
        [userId]
      );
      const markedThisMonth = parseInt(markedThisMonthResult.rows[0].count, 10);
      
      if (markedThisMonth >= 2) {
        return res.status(400).json({ success: false, message: 'You can only mark 2 favorite numbers per month.' });
      }
    }

    // Perform toggle
    const updateResult = await db.query(
      `UPDATE favorites 
       SET is_favorite = $1, 
           marked_favorite_at = CASE WHEN $1 = true THEN NOW() ELSE marked_favorite_at END 
       WHERE id = $2 RETURNING *`,
      [newFavoriteState, id]
    );

    res.status(200).json({
      success: true,
      message: newFavoriteState ? 'Marked as favorite' : 'Removed from favorites',
      data: updateResult.rows[0]
    });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Permanently removes a favorite entry from the user's account
export const deleteFavorite = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Favorite deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting favorite:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
