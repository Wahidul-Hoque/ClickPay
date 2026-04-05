import express from 'express';
import { addFavorite, getFavorites, toggleFavorite, deleteFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Require authentication

// Management routes for personalized contact and agent favorites
router.post('/', addFavorite);
router.get('/', getFavorites);
router.patch('/:id/toggle', toggleFavorite);
router.delete('/:id', deleteFavorite);

export default router;