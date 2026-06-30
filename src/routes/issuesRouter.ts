import { Router } from 'express';
import { issuesController } from '../controllers/issuesController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', issuesController.getIssues);
router.post('/', authenticate, issuesController.createIssue);
router.get('/:id', issuesController.getIssueById);
router.post('/:id/vote', authenticate, issuesController.toggleVote);
router.post('/:id/verify', authenticate, issuesController.verifyIssue);
router.post('/:id/comment', authenticate, issuesController.addComment);
router.put('/:id/status', authenticate, requireAdmin, issuesController.updateIssueStatus);

export default router;
