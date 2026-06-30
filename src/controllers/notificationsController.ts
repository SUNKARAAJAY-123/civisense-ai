import { Response } from 'express';
import { supabaseService } from '../services/supabaseService';
import { AuthenticatedRequest } from '../middleware/auth';

export const notificationsController = {
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const list = await supabaseService.getNotifications(req.user!.id);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve notifications.' });
    }
  },

  async readNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await supabaseService.markNotificationAsRead(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
  },

  async readAllNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await supabaseService.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark all notifications as read.' });
    }
  }
};
