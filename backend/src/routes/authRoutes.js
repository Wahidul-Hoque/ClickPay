import express from 'express';
import authController from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.post('/logout', protect, authController.logout);

export default router;
