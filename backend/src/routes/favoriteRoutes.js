import express from 'express';
import { addFavorite, getFavorites, toggleFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Require authentication

router.post('/', addFavorite);
router.get('/', getFavorites);
router.patch('/:id/toggle', toggleFavorite);

export default router;