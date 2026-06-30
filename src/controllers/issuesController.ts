import { Response } from 'express';
import crypto from 'crypto';
import { supabaseService } from '../services/supabaseService';
import { analyzeIssueImage } from '../gemini-service';
import { Issue, Comment } from '../types/index';
import { AuthenticatedRequest } from '../middleware/auth';

export const issuesController = {
  async getIssues(req: any, res: Response): Promise<void> {
    try {
      const { status, category, severity, mine, userId } = req.query;
      const filters: any = {};

      if (status) filters.status = status;
      if (category) filters.category = category;
      if (severity) filters.severity = severity;
      if (mine === 'true' && userId) filters.reporterId = userId;

      const list = await supabaseService.getIssues(filters);

      // Sort: open & higher severity first, then newest
      list.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        
        const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const weightA = severityWeight[a.severity] || 0;
        const weightB = severityWeight[b.severity] || 0;
        if (weightA !== weightB) return weightB - weightA;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json(list);
    } catch (err: any) {
      console.error('Failed to get issues:', err);
      res.status(500).json({ error: 'Failed to retrieve community issues.' });
    }
  },

  async createIssue(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { image, location, categoryHint } = req.body;
    
    if (!location || !location.address || !location.lat || !location.lng) {
      res.status(400).json({ error: 'Accurate location and address are required' });
      return;
    }

    try {
      const reporter = await supabaseService.findUserById(req.user!.id);
      if (!reporter) {
        res.status(404).json({ error: 'Reporter user profile not found' });
        return;
      }

      // 1. Fetch active issues to feed Gemini for duplicates matching
      const activeIssues = await supabaseService.getIssues({ status: 'open' });
      
      const base64Image = image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      // 2. Perform AI Analysis via Gemini
      const aiResult = await analyzeIssueImage(base64Image, activeIssues, categoryHint);

      const isDuplicate = !!aiResult.duplicateOf;
      const issueStatus = isDuplicate ? 'duplicate' : 'open';
      const issueId = `iss-${crypto.randomBytes(4).toString('hex')}`;

      // 3. Upload image to Supabase Storage if it's base64
      let imageUrl = base64Image;
      if (base64Image.startsWith('data:image')) {
        const fileExt = base64Image.split(';')[0].split('/')[1] || 'png';
        const fileName = `${issueId}-${Date.now()}.${fileExt}`;
        imageUrl = await supabaseService.uploadImageToStorage(base64Image, fileName);
      }

      const newIssue: Issue = {
        id: issueId,
        reporterId: reporter.id,
        reporterName: reporter.name,
        reporterAvatar: reporter.avatar,
        title: aiResult.title,
        description: aiResult.description,
        category: aiResult.category,
        severity: aiResult.severity,
        status: issueStatus,
        image: imageUrl,
        location: {
          lat: Number(location.lat),
          lng: Number(location.lng),
          address: location.address
        },
        upvotes: [],
        verifications: [],
        department: aiResult.department,
        urgency: aiResult.urgency,
        precautions: aiResult.precautions,
        estimatedResolution: aiResult.estimatedResolution,
        duplicateOf: aiResult.duplicateOf,
        tags: aiResult.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 4. Save Issue to Supabase Database
      await supabaseService.createIssue(newIssue);

      // Reward points for filing a report (+50 points)
      let rewardPoints = 50;
      let message = `You successfully reported a civic issue: "${newIssue.title}". Our AI has dispatched this to ${newIssue.department}. You earned 50 Hero points!`;

      if (isDuplicate) {
        rewardPoints = 15; // Lower points for duplicates
        message = `You submitted a report that matches an existing active issue: "${newIssue.title}". We have linked your submission to prevent municipal clutter. You earned 15 Hero points for the notification.`;
      }

      // Update user points and reward them
      await supabaseService.updateUserPoints(reporter.id, rewardPoints);

      // Send points notification
      await supabaseService.createNotification({
        id: `not-${crypto.randomBytes(4).toString('hex')}`,
        userId: reporter.id,
        title: isDuplicate ? 'Duplicate Issue Linked 🔗' : 'New Report Logged! 📢',
        message,
        issueId: newIssue.id,
        type: 'reward',
        read: false,
        createdAt: new Date().toISOString()
      });

      res.status(210).json(newIssue);
    } catch (err: any) {
      console.error('Issue generation failed:', err);
      res.status(500).json({ error: 'AI analysis failed to process the report. Please try again.' });
    }
  },

  async getIssueById(req: any, res: Response): Promise<void> {
    try {
      const issue = await supabaseService.findIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const comments = await supabaseService.getComments(issue.id);
      res.json({
        issue,
        comments
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve issue details.' });
    }
  },

  async toggleVote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const issue = await supabaseService.findIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const userId = req.user!.id;
      const { voted, upvotes } = await supabaseService.toggleVote(issue.id, userId);

      // Send notification to the reporter
      if (voted && issue.reporterId !== userId) {
        await supabaseService.createNotification({
          id: `not-${crypto.randomBytes(4).toString('hex')}`,
          userId: issue.reporterId,
          title: 'Community Support Upvote 👍',
          message: `${req.user!.name} upvoted your issue: "${issue.title}".`,
          issueId: issue.id,
          type: 'status_change',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      res.json({ upvotes, voted });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to perform upvote action.' });
    }
  },

  async verifyIssue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const issue = await supabaseService.findIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const userId = req.user!.id;
      
      if (issue.reporterId === userId) {
        res.status(400).json({ error: 'You cannot verify your own reported issue' });
        return;
      }

      if (issue.verifications.includes(userId)) {
        res.status(400).json({ error: 'You have already verified this issue' });
        return;
      }

      const updatedVerifications = await supabaseService.addVerification(issue.id, userId);

      // Citizen earns +15 points for on-site verification
      const newPoints = await supabaseService.updateUserPoints(userId, 15);
      
      await supabaseService.createNotification({
        id: `not-${crypto.randomBytes(4).toString('hex')}`,
        userId: userId,
        title: 'Civic Duty Reward! 🎖️',
        message: `You earned 15 Hero points for verifying the report: "${issue.title}".`,
        issueId: issue.id,
        type: 'reward',
        read: false,
        createdAt: new Date().toISOString()
      });

      // Notify reporter
      await supabaseService.createNotification({
        id: `not-${crypto.randomBytes(4).toString('hex')}`,
        userId: issue.reporterId,
        title: 'Report Verified! ✅',
        message: `Your report "${issue.title}" has been verified on-site by ${req.user!.name}. This increases its municipal resolution priority.`,
        issueId: issue.id,
        type: 'status_change',
        read: false,
        createdAt: new Date().toISOString()
      });

      res.json({ verifications: updatedVerifications, points: newPoints });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Verification failed.' });
    }
  },

  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const issue = await supabaseService.findIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const { content } = req.body;
      if (!content || content.trim() === '') {
        res.status(400).json({ error: 'Comment content is required' });
        return;
      }

      const newComment: Comment = {
        id: `com-${crypto.randomBytes(4).toString('hex')}`,
        issueId: issue.id,
        userId: req.user!.id,
        userName: req.user!.name,
        userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.user!.name)}`,
        content: content.trim(),
        createdAt: new Date().toISOString()
      };

      await supabaseService.createComment(newComment);

      // Notify reporter if comment is by another user
      if (issue.reporterId !== req.user!.id) {
        await supabaseService.createNotification({
          id: `not-${crypto.randomBytes(4).toString('hex')}`,
          userId: issue.reporterId,
          title: 'New Comment on Report 💬',
          message: `${req.user!.name} commented: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
          issueId: issue.id,
          type: 'comment',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      res.status(210).json(newComment);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add comment.' });
    }
  },

  async updateIssueStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const issue = await supabaseService.findIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const { status, assignedTo, department, resolutionDetails } = req.body;

      const updates: Partial<Issue> = {};
      if (status) updates.status = status;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (department) updates.department = department;
      if (resolutionDetails !== undefined) updates.resolutionDetails = resolutionDetails;

      const updated = await supabaseService.updateIssue(issue.id, updates);

      // Hand out reward points once an issue is successfully resolved (+100 points!)
      if (status === 'resolved') {
        const reporter = await supabaseService.findUserById(issue.reporterId);
        if (reporter) {
          await supabaseService.updateUserPoints(reporter.id, 100);
          await supabaseService.incrementResolvedCount(reporter.id);

          await supabaseService.createNotification({
            id: `not-${crypto.randomBytes(4).toString('hex')}`,
            userId: reporter.id,
            title: 'Issue Resolved! 🎉🏆',
            message: `Great news! Your reported issue "${issue.title}" has been officially marked as resolved. You have been awarded 100 Hero points! Details: ${resolutionDetails || 'Municipal work finished.'}`,
            issueId: issue.id,
            type: 'reward',
            read: false,
            createdAt: new Date().toISOString()
          });
        }

        // Award +10 points to every verification participant!
        for (const verifierId of issue.verifications) {
          const verifier = await supabaseService.findUserById(verifierId);
          if (verifier) {
            await supabaseService.updateUserPoints(verifierId, 10);
            await supabaseService.createNotification({
              id: `not-${crypto.randomBytes(4).toString('hex')}`,
              userId: verifierId,
              title: 'Verification Success Reward! 🎖️',
              message: `The issue "${issue.title}" you verified has been resolved. You earned 10 bonus points!`,
              issueId: issue.id,
              type: 'reward',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      } else {
        // Notify general status update
        await supabaseService.createNotification({
          id: `not-${crypto.randomBytes(4).toString('hex')}`,
          userId: issue.reporterId,
          title: `Report Status Updated: ${updated.status.toUpperCase()}`,
          message: `Your report "${issue.title}" status has changed to "${updated.status}". Assigned department: ${updated.department}.`,
          issueId: issue.id,
          type: 'status_change',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update issue status.' });
    }
  }
};
