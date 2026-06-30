import { Request, Response } from 'express';
import { supabaseService } from '../services/supabaseService';
import { AuthenticatedRequest } from '../middleware/auth';

export const rewardsController = {
  async getRewards(req: Request, res: Response): Promise<void> {
    try {
      const rewards = await supabaseService.getRewards();
      res.json(rewards);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve rewards catalogue.' });
    }
  },

  async redeemReward(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { itemId } = req.body;
    try {
      const result = await supabaseService.redeemReward(req.user!.id, itemId);
      res.status(210).json(result);
    } catch (err: any) {
      console.error('Failed to redeem reward:', err);
      res.status(400).json({ error: err.message || 'Reward redemption failed.' });
    }
  }
};
