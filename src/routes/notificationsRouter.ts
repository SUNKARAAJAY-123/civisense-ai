import { Router } from 'express';
import { notificationsController } from '../controllers/notificationsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, notificationsController.getNotifications);
router.post('/:id/read', authenticate, notificationsController.readNotification);
router.post('/read-all', authenticate, notificationsController.readAllNotifications);

export default router;
