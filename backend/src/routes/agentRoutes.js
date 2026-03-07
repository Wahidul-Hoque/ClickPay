import express from 'express';
import agentController from '../controllers/agentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes here require authentication
router.use(protect);

// Basic middleware to check role
const isAgent = (req, res, next) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ success: false, message: 'Access denied. Agents only.' });
  }
  next();
};

router.get('/dashboard', isAgent, agentController.getDashboard);
router.post('/cash-in', isAgent, agentController.cashIn);
router.get('/history', isAgent, agentController.getHistory);
router.get('/rankings', isAgent, agentController.getRankings);

export default router;