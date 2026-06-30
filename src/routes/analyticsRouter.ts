import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/analytics', analyticsController.getAnalytics);
router.get('/leaderboard', analyticsController.getLeaderboard);

export default router;
