import { Router } from 'express';
import { rewardsController } from '../controllers/rewardsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', rewardsController.getRewards);
router.post('/redeem', authenticate, rewardsController.redeemReward);

export default router;
