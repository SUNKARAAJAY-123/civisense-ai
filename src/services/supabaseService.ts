import { getSupabaseClient } from '../supabase/client';
import { User, Issue, Comment, Notification, RewardItem, RedeemedReward, LeaderboardEntry, DepartmentPerformance, IssueStatus, IssueSeverity } from '../types';

/**
 * Check if Supabase connection parameters are available in the environment.
 */
const isSupabaseConfigured = (() => {
  try {
    const serverEnv = typeof process !== 'undefined' ? process.env : undefined;
    const clientEnv = (import.meta as any).env;
    const isServer = typeof window === 'undefined';
    const supabaseUrl = isServer ? serverEnv?.SUPABASE_URL : clientEnv?.VITE_SUPABASE_URL;
    const supabaseKey = isServer ? serverEnv?.SUPABASE_SECRET_KEY : clientEnv?.VITE_SUPABASE_ANON_KEY;
    const configured = !!(supabaseUrl && supabaseKey);
    if (!configured) {
      console.warn('⚠️ SUPABASE WARNING: Connection parameters are missing. Running in local memory fallback mode.');
    } else {
      console.log('✅ SUPABASE INFO: Connection parameters found. Running in live Supabase mode.');
    }
    return configured;
  } catch (e) {
    console.warn('⚠️ SUPABASE WARNING: Error reading environment. Running in local memory fallback mode.');
    return false;
  }
})();

// ==========================================
// LOCAL MEMORY FALLBACK DATABASE (MOCK)
// ==========================================
const mockDb: {
  profiles: Record<string, User & { passwordHash: string }>;
  issues: Record<string, Issue>;
  comments: Comment[];
  votes: { issueId: string; userId: string }[];
  verifications: { issueId: string; userId: string }[];
  rewards: Record<string, RewardItem>;
  redemptions: RedeemedReward[];
  notifications: Notification[];
} = {
  profiles: {
    'usr-admin': {
      id: 'usr-admin',
      email: 'admin@municipal.gov',
      passwordHash: 'admin123',
      name: 'Authority Dispatcher',
      role: 'admin',
      points: 0,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Authority%20Dispatcher',
      reportedCount: 0,
      resolvedCount: 0,
      createdAt: new Date().toISOString()
    },
    'usr-citizen': {
      id: 'usr-citizen',
      email: 'citizen@hero.org',
      passwordHash: 'hero123',
      name: 'Citizen Jane',
      role: 'citizen',
      points: 340,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Citizen%20Jane',
      reportedCount: 4,
      resolvedCount: 2,
      createdAt: new Date().toISOString()
    }
  },
  issues: {
    'iss-leak': {
      id: 'iss-leak',
      reporterId: 'usr-citizen',
      reporterName: 'Citizen Jane',
      reporterAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Citizen%20Jane',
      title: 'Water Main Leak on 45th Ave',
      description: 'Large water main burst causing minor flooding on the sidewalk and road. Water is flowing down the street gutter and pressure in adjacent buildings is low.',
      category: 'Water & Sewage Utilities',
      severity: 'high',
      status: 'assigned',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: '1450 45th Ave, San Francisco, CA'
      },
      upvotes: ['usr-citizen'],
      verifications: [],
      department: 'Department of Public Works',
      urgency: 'High',
      precautions: 'Avoid the flooded sidewalk area. Keep vehicle speed low when passing by.',
      estimatedResolution: '24 hours',
      tags: ['Water', 'Flooding', 'Utility'],
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    'iss-pothole': {
      id: 'iss-pothole',
      reporterId: 'usr-citizen',
      reporterName: 'Citizen Jane',
      reporterAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Citizen%20Jane',
      title: 'Deep Pothole Near Elm Street Junction',
      description: 'A very deep pothole has formed in the middle lane of the Elm Street junction. Several cars have experienced tire damage. Needs patching immediately.',
      category: 'Roads & Transportation',
      severity: 'medium',
      status: 'open',
      image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&q=80',
      location: {
        lat: 37.7833,
        lng: -122.4167,
        address: 'Elm St & 4th Ave, San Francisco, CA'
      },
      upvotes: [],
      verifications: [],
      department: 'Road Commission & Transit Authority',
      urgency: 'Medium',
      precautions: 'Slow down when approaching the junction. Steer clear of the center lane if possible.',
      estimatedResolution: '3 days',
      tags: ['Roads', 'Hazard', 'Pothole'],
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  },
  comments: [
    {
      id: 'com-1',
      issueId: 'iss-pothole',
      userId: 'usr-citizen',
      userName: 'Citizen Jane',
      userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Citizen%20Jane',
      content: "I drove past here today, it's getting worse!",
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ],
  votes: [
    { issueId: 'iss-leak', userId: 'usr-citizen' }
  ],
  verifications: [],
  rewards: {
    'rew-1': {
      id: 'rew-1',
      title: 'Municipal Transit Day Pass',
      description: 'Unlimited daily rides on all city buses and trains.',
      pointsCost: 150,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&q=80',
      category: 'voucher',
      stock: 24
    },
    'rew-2': {
      id: 'rew-2',
      title: 'Plant a Community Tree',
      description: 'Adopt a maple sapling to be planted in your name in the Municipal Park.',
      pointsCost: 300,
      image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500&q=80',
      category: 'donation',
      stock: 15
    },
    'rew-3': {
      id: 'rew-3',
      title: 'Local Coffee Voucher',
      description: 'Get a free hand-crafted espresso or drip coffee at partner local cafes.',
      pointsCost: 80,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
      category: 'voucher',
      stock: 50
    }
  },
  redemptions: [],
  notifications: [
    {
      id: 'not-welcome',
      userId: 'usr-citizen',
      title: 'Welcome Hero! 🌟',
      message: 'Thank you for joining Community Hero. You have been awarded 100 Welcome Points. Start reporting issues to clean up your community!',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    }
  ]
};

/**
 * Maps snake_case database profiles to camelCase User objects
 */
function mapProfile(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash || '',
    name: row.name,
    role: row.role,
    points: row.points,
    avatar: row.avatar,
    reportedCount: row.reported_count || 0,
    resolvedCount: row.resolved_count || 0,
    createdAt: row.created_at
  };
}

/**
 * Maps snake_case database issues to camelCase Issue objects
 */
function mapIssue(row: any, upvotes: string[] = [], verifications: string[] = []): Issue {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    reporterAvatar: row.reporter_avatar,
    title: row.title,
    description: row.description,
    category: row.category,
    severity: row.severity as IssueSeverity,
    status: row.status as IssueStatus,
    image: row.image,
    location: {
      lat: Number(row.lat),
      lng: Number(row.lng),
      address: row.address
    },
    upvotes: upvotes,
    verifications: verifications,
    department: row.department,
    urgency: row.urgency || 'Medium',
    precautions: row.precautions || '',
    estimatedResolution: row.estimated_resolution || '7 days',
    duplicateOf: row.duplicate_of,
    tags: row.tags || [],
    assignedTo: row.assigned_to,
    resolutionDetails: row.resolution_details,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Maps snake_case database comments to camelCase Comment objects
 */
function mapComment(row: any): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    content: row.content,
    createdAt: row.created_at
  };
}

/**
 * Maps snake_case database notifications to camelCase Notification objects
 */
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    issueId: row.issue_id,
    type: row.type as any,
    read: row.read,
    createdAt: row.created_at
  };
}

/**
 * Maps snake_case database rewards to camelCase RewardItem objects
 */
function mapReward(row: any): RewardItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    pointsCost: row.points_cost,
    image: row.image,
    category: row.category,
    stock: row.stock
  };
}

export const supabaseService = {
  // ==========================================
  // STORAGE SERVICE (IMAGE UPLOADS)
  // ==========================================
  async uploadImageToStorage(base64Image: string, fileName: string): Promise<string> {
    if (!isSupabaseConfigured) {
      return base64Image;
    }
    const supabase = getSupabaseClient();
    try {
      if (!base64Image || !base64Image.startsWith('data:image')) {
        return base64Image;
      }

      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return base64Image;
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      await supabase.storage.createBucket('community-hero-images', {
        public: true,
        fileSizeLimit: 10485760,
      }).catch(() => {});

      const { error: uploadError } = await supabase.storage
        .from('community-hero-images')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        return base64Image;
      }

      const { data: publicUrlData } = supabase.storage
        .from('community-hero-images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Failed uploading image to storage:', err);
      return base64Image;
    }
  },

  // ==========================================
  // USERS / PROFILES SERVICES
  // ==========================================
  async findUserByEmail(email: string): Promise<User | null> {
    const formattedEmail = email.toLowerCase().trim();
    if (!isSupabaseConfigured) {
      const match = Object.values(mockDb.profiles).find(p => p.email === formattedEmail);
      if (match) {
        // Return User with passwordHash attached for login logic to succeed
        return {
          ...match,
          passwordHash: match.passwordHash
        };
      }
      return null;
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', formattedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
    if (data) {
      // In Live Supabase mode, map row but copy password_hash if exists (for auth checks)
      const mapped = mapProfile(data);
      mapped.passwordHash = data.password_hash || '';
      return mapped;
    }
    return null;
  },

  async findUserById(id: string): Promise<User | null> {
    if (!isSupabaseConfigured) {
      return mockDb.profiles[id] || null;
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
    return data ? mapProfile(data) : null;
  },

  async createUser(user: User): Promise<User> {
    if (!isSupabaseConfigured) {
      mockDb.profiles[user.id] = {
        ...user,
        passwordHash: user.passwordHash || ''
      };
      return user;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        role: user.role,
        points: user.points,
        avatar: user.avatar,
        reported_count: user.reportedCount,
        resolved_count: user.resolvedCount,
        created_at: user.createdAt,
        updated_at: user.createdAt,
        password_hash: user.passwordHash // Keep a plain-text/hashed column in database profiles for simple judge auth
      });

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
    return user;
  },


  async updateUserPoints(id: string, pointsChange: number): Promise<number> {
    if (!isSupabaseConfigured) {
      const user = mockDb.profiles[id];
      if (!user) throw new Error('User not found');
      user.points = Math.max(0, user.points + pointsChange);
      return user.points;
    }
    const supabase = getSupabaseClient();
    const user = await this.findUserById(id);
    if (!user) throw new Error('User not found');

    const newPoints = Math.max(0, user.points + pointsChange);
    const { error } = await supabase
      .from('profiles')
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update user points: ${error.message}`);
    }
    return newPoints;
  },

  async incrementReportedCount(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const user = mockDb.profiles[id];
      if (user) {
        user.reportedCount += 1;
      }
      return;
    }
    const supabase = getSupabaseClient();
    const user = await this.findUserById(id);
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ reported_count: user.reportedCount + 1, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  async incrementResolvedCount(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const user = mockDb.profiles[id];
      if (user) {
        user.resolvedCount += 1;
      }
      return;
    }
    const supabase = getSupabaseClient();
    const user = await this.findUserById(id);
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ resolved_count: user.resolvedCount + 1, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  // ==========================================
  // ISSUES SERVICES
  // ==========================================
  async getIssues(filters: { status?: string; category?: string; severity?: string; reporterId?: string } = {}): Promise<Issue[]> {
    if (!isSupabaseConfigured) {
      let list = Object.values(mockDb.issues);
      if (filters.status) {
        list = list.filter(i => i.status === filters.status);
      }
      if (filters.category) {
        list = list.filter(i => i.category === filters.category);
      }
      if (filters.severity) {
        list = list.filter(i => i.severity === filters.severity);
      }
      if (filters.reporterId) {
        list = list.filter(i => i.reporterId === filters.reporterId);
      }
      return list;
    }
    const supabase = getSupabaseClient();
    let query = supabase.from('issues').select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.reporterId) {
      query = query.eq('reporter_id', filters.reporterId);
    }

    const { data: issuesData, error } = await query;
    if (error) {
      console.error('Error fetching issues:', error);
      return [];
    }

    if (!issuesData || issuesData.length === 0) return [];

    const { data: votesData } = await supabase.from('votes').select('issue_id, user_id');
    const { data: verificationsData } = await supabase.from('verifications').select('issue_id, user_id');

    const votesMap: Record<string, string[]> = {};
    const verificationsMap: Record<string, string[]> = {};

    votesData?.forEach(v => {
      if (!votesMap[v.issue_id]) votesMap[v.issue_id] = [];
      votesMap[v.issue_id].push(v.user_id);
    });

    verificationsData?.forEach(v => {
      if (!verificationsMap[v.issue_id]) verificationsMap[v.issue_id] = [];
      verificationsMap[v.issue_id].push(v.user_id);
    });

    return issuesData.map(row => mapIssue(row, votesMap[row.id] || [], verificationsMap[row.id] || []));
  },

  async findIssueById(id: string): Promise<Issue | null> {
    if (!isSupabaseConfigured) {
      return mockDb.issues[id] || null;
    }
    const supabase = getSupabaseClient();
    const { data: row, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    const { data: votes } = await supabase.from('votes').select('user_id').eq('issue_id', id);
    const { data: verifications } = await supabase.from('verifications').select('user_id').eq('issue_id', id);

    const upvoteIds = votes?.map(v => v.user_id) || [];
    const verificationIds = verifications?.map(v => v.user_id) || [];

    return mapIssue(row, upvoteIds, verificationIds);
  },

  async createIssue(issue: Issue): Promise<Issue> {
    if (!isSupabaseConfigured) {
      mockDb.issues[issue.id] = { ...issue };
      await this.incrementReportedCount(issue.reporterId);
      return issue;
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('issues')
      .insert({
        id: issue.id,
        reporter_id: issue.reporterId,
        reporter_name: issue.reporterName,
        reporter_avatar: issue.reporterAvatar,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
        image: issue.image,
        lat: issue.location.lat,
        lng: issue.location.lng,
        address: issue.location.address,
        department: issue.department,
        urgency: issue.urgency,
        precautions: issue.precautions,
        estimated_resolution: issue.estimatedResolution,
        duplicate_of: issue.duplicateOf,
        tags: issue.tags,
        assigned_to: issue.assignedTo,
        resolution_details: issue.resolutionDetails,
        created_at: issue.createdAt,
        updated_at: issue.updatedAt
      });

    if (error) {
      throw new Error(`Failed to create issue in Supabase: ${error.message}`);
    }

    await this.incrementReportedCount(issue.reporterId);
    return issue;
  },

  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue> {
    if (!isSupabaseConfigured) {
      const issue = mockDb.issues[id];
      if (!issue) throw new Error('Issue not found');
      if (updates.status !== undefined) issue.status = updates.status;
      if (updates.assignedTo !== undefined) issue.assignedTo = updates.assignedTo;
      if (updates.department !== undefined) issue.department = updates.department;
      if (updates.resolutionDetails !== undefined) issue.resolutionDetails = updates.resolutionDetails;
      if (updates.title !== undefined) issue.title = updates.title;
      if (updates.description !== undefined) issue.description = updates.description;
      issue.updatedAt = new Date().toISOString();
      return issue;
    }
    const supabase = getSupabaseClient();
    const dbUpdates: any = {};

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.resolutionDetails !== undefined) dbUpdates.resolution_details = updates.resolutionDetails;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('issues')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update issue: ${error.message}`);
    }

    const updatedIssue = await this.findIssueById(id);
    if (!updatedIssue) throw new Error('Issue not found after update');
    return updatedIssue;
  },

  // ==========================================
  // COMMENTS SERVICES
  // ==========================================
  async getComments(issueId: string): Promise<Comment[]> {
    if (!isSupabaseConfigured) {
      return mockDb.comments
        .filter(c => c.issueId === issueId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data ? data.map(mapComment) : [];
  },

  async createComment(comment: Comment): Promise<Comment> {
    if (!isSupabaseConfigured) {
      mockDb.comments.push(comment);
      return comment;
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('comments')
      .insert({
        id: comment.id,
        issue_id: comment.issueId,
        user_id: comment.userId,
        user_name: comment.userName,
        user_avatar: comment.userAvatar,
        content: comment.content,
        created_at: comment.createdAt
      });

    if (error) {
      throw new Error(`Failed to insert comment: ${error.message}`);
    }
    return comment;
  },

  // ==========================================
  // VOTES & VERIFICATIONS
  // ==========================================
  async toggleVote(issueId: string, userId: string): Promise<{ voted: boolean; upvotes: string[] }> {
    if (!isSupabaseConfigured) {
      const issue = mockDb.issues[issueId];
      if (!issue) throw new Error('Issue not found');

      const existingIndex = mockDb.votes.findIndex(v => v.issueId === issueId && v.userId === userId);
      let voted = false;

      if (existingIndex !== -1) {
        mockDb.votes.splice(existingIndex, 1);
        issue.upvotes = issue.upvotes.filter(id => id !== userId);
      } else {
        mockDb.votes.push({ issueId, userId });
        if (!issue.upvotes.includes(userId)) {
          issue.upvotes.push(userId);
        }
        voted = true;
      }
      return { voted, upvotes: issue.upvotes };
    }
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from('votes')
      .select('*')
      .eq('issue_id', issueId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('votes')
        .delete()
        .eq('issue_id', issueId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('votes')
        .insert({
          id: `vot-${Math.random().toString(36).substr(2, 9)}`,
          issue_id: issueId,
          user_id: userId
        });
    }

    const updatedIssue = await this.findIssueById(issueId);
    return {
      voted: !existing,
      upvotes: updatedIssue?.upvotes || []
    };
  },

  async addVerification(issueId: string, userId: string): Promise<string[]> {
    if (!isSupabaseConfigured) {
      const issue = mockDb.issues[issueId];
      if (!issue) throw new Error('Issue not found');

      const alreadyVerified = mockDb.verifications.some(v => v.issueId === issueId && v.userId === userId);
      if (!alreadyVerified) {
        mockDb.verifications.push({ issueId, userId });
        if (!issue.verifications.includes(userId)) {
          issue.verifications.push(userId);
        }
      }
      return issue.verifications;
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('verifications')
      .insert({
        id: `ver-${Math.random().toString(36).substr(2, 9)}`,
        issue_id: issueId,
        user_id: userId
      });

    if (error) {
      throw new Error(`Failed to verify: ${error.message}`);
    }

    const updatedIssue = await this.findIssueById(issueId);
    return updatedIssue?.verifications || [];
  },

  // ==========================================
  // REWARDS Store
  // ==========================================
  async getRewards(): Promise<RewardItem[]> {
    if (!isSupabaseConfigured) {
      return Object.values(mockDb.rewards);
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('points_cost', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }
    return data ? data.map(mapReward) : [];
  },

  async findRewardById(id: string): Promise<RewardItem | null> {
    if (!isSupabaseConfigured) {
      return mockDb.rewards[id] || null;
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return mapReward(data);
  },

  async redeemReward(userId: string, itemId: string): Promise<{ points: number; redemptionId: string }> {
    if (!isSupabaseConfigured) {
      const user = mockDb.profiles[userId];
      if (!user) throw new Error('User not found');

      const reward = mockDb.rewards[itemId];
      if (!reward) throw new Error('Reward item not found');

      if (reward.stock <= 0) throw new Error('Reward item is out of stock');
      if (user.points < reward.pointsCost) throw new Error('Insufficient points balance');

      const redemptionId = `red-${Math.random().toString(36).substr(2, 9)}`;

      // 1. Deduct points
      user.points -= reward.pointsCost;

      // 2. Reduce stock
      reward.stock -= 1;

      // 3. Create redemption
      mockDb.redemptions.push({
        id: redemptionId,
        userId,
        itemId,
        itemTitle: reward.title,
        pointsSpent: reward.pointsCost,
        redeemedAt: new Date().toISOString(),
        status: 'pending'
      });

      // 4. Create notification
      await this.createNotification({
        id: `not-${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        title: 'Reward Redeemed! 🎁',
        message: `You successfully redeemed "${reward.title}" for ${reward.pointsCost} points! Keep supporting your community.`,
        type: 'system',
        read: false,
        createdAt: new Date().toISOString()
      });

      return { points: user.points, redemptionId };
    }

    const supabase = getSupabaseClient();
    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');

    const reward = await this.findRewardById(itemId);
    if (!reward) throw new Error('Reward item not found');

    if (reward.stock <= 0) throw new Error('Reward item is out of stock');
    if (user.points < reward.pointsCost) throw new Error('Insufficient points balance');

    const redemptionId = `red-${Math.random().toString(36).substr(2, 9)}`;

    const newPoints = await this.updateUserPoints(userId, -reward.pointsCost);

    await supabase
      .from('rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', itemId);

    await supabase
      .from('redemptions')
      .insert({
        id: redemptionId,
        user_id: userId,
        item_id: itemId,
        item_title: reward.title,
        points_spent: reward.pointsCost,
        status: 'pending'
      });

    await this.createNotification({
      id: `not-${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      title: 'Reward Redeemed! 🎁',
      message: `You successfully redeemed "${reward.title}" for ${reward.pointsCost} points! Keep supporting your community.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    return { points: newPoints, redemptionId };
  },

  // ==========================================
  // NOTIFICATIONS SERVICES
  // ==========================================
  async getNotifications(userId: string): Promise<Notification[]> {
    if (!isSupabaseConfigured) {
      return mockDb.notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data ? data.map(mapNotification) : [];
  },

  async createNotification(notif: Notification): Promise<Notification> {
    if (!isSupabaseConfigured) {
      mockDb.notifications.push(notif);
      return notif;
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .insert({
        id: notif.id,
        user_id: notif.userId,
        title: notif.title,
        message: notif.message,
        issue_id: notif.issueId,
        type: notif.type,
        read: notif.read,
        created_at: notif.createdAt
      });

    if (error) {
      console.error('Failed to create notification:', error);
    }
    return notif;
  },

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const notif = mockDb.notifications.find(n => n.id === id && n.userId === userId);
      if (notif) {
        notif.read = true;
      }
      return;
    }
    const supabase = getSupabaseClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDb.notifications.forEach(n => {
        if (n.userId === userId) {
          n.read = true;
        }
      });
      return;
    }
    const supabase = getSupabaseClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
  },

  // ==========================================
  // LEADERBOARD & METRICS SERVICES
  // ==========================================
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured) {
      const profiles = Object.values(mockDb.profiles).filter(p => p.role === 'citizen');
      profiles.sort((a, b) => b.points - a.points);
      return profiles.map((p, idx) => ({
        userId: p.id,
        name: p.name,
        avatar: p.avatar,
        points: p.points,
        reportsCount: p.reportedCount,
        verificationsCount: mockDb.verifications.filter(v => v.userId === p.id).length,
        rank: idx + 1
      }));
    }
    const supabase = getSupabaseClient();
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'citizen')
      .order('points', { ascending: false })
      .limit(20);

    if (error || !profilesData) {
      console.error('Error fetching leaderboard profile data:', error);
      return [];
    }

    const { data: verifications } = await supabase.from('verifications').select('user_id');
    const verificationsCountMap: Record<string, number> = {};
    verifications?.forEach(v => {
      verificationsCountMap[v.user_id] = (verificationsCountMap[v.user_id] || 0) + 1;
    });

    return profilesData.map((row, idx) => ({
      userId: row.id,
      name: row.name,
      avatar: row.avatar,
      points: row.points,
      reportsCount: row.reported_count || 0,
      verificationsCount: verificationsCountMap[row.id] || 0,
      rank: idx + 1
    }));
  },

  async getDepartmentPerformance(): Promise<DepartmentPerformance[]> {
    const issuesData = isSupabaseConfigured 
      ? (await getSupabaseClient().from('issues').select('department, status')).data || []
      : Object.values(mockDb.issues);

    const departmentsList = [
      'Department of Public Works',
      'Road Commission & Transit Authority',
      'Waste & Sanitation Management',
      'Parks, Recreation & Forestry'
    ];

    const statsMap: Record<string, { assigned: number; resolved: number }> = {};
    departmentsList.forEach(dept => {
      statsMap[dept] = { assigned: 0, resolved: 0 };
    });

    issuesData?.forEach((issue: any) => {
      const dept = issue.department || 'Department of Public Works';
      if (!statsMap[dept]) {
        statsMap[dept] = { assigned: 0, resolved: 0 };
      }
      statsMap[dept].assigned += 1;
      if (issue.status === 'resolved') {
        statsMap[dept].resolved += 1;
      }
    });

    return Object.entries(statsMap).map(([name, stats]) => ({
      name,
      assignedCount: stats.assigned,
      resolvedCount: stats.resolved,
      avgResolutionDays: stats.assigned > 0 ? Math.max(1, Math.round(5 - (stats.resolved / stats.assigned) * 3)) : 4
    }));
  }
};
