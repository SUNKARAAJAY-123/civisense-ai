export type UserRole = 'citizen' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  points: number;
  avatar: string;
  reportedCount: number;
  resolvedCount: number;
  createdAt: string;
}

export type IssueStatus = 'open' | 'assigned' | 'resolved' | 'duplicate';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IssueLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Issue {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  title: string;
  description: string;
  category: string;
  severity: IssueSeverity;
  status: IssueStatus;
  image?: string; // base64 or placeholder URL
  location: IssueLocation;
  upvotes: string[]; // User IDs who upvoted
  verifications: string[]; // User IDs who verified the issue is real
  department: string;
  urgency: string; // 'Low' | 'Medium' | 'High' | 'Immediate'
  precautions: string; // Temporary safety suggestions
  estimatedResolution: string; // Timeframe predicted by AI
  duplicateOf?: string; // ID of the master issue if it's a duplicate
  tags: string[];
  assignedTo?: string; // Responsible authority name
  resolutionDetails?: string; // Filled when status becomes resolved
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  issueId?: string;
  type: 'status_change' | 'comment' | 'reward' | 'system';
  read: boolean;
  createdAt: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  image: string;
  category: string;
  stock: number;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  itemId: string;
  itemTitle: string;
  pointsSpent: number;
  redeemedAt: string;
  status: 'pending' | 'completed';
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  points: number;
  reportsCount: number;
  verificationsCount: number;
  rank?: number;
}

export interface DepartmentPerformance {
  name: string;
  assignedCount: number;
  resolvedCount: number;
  avgResolutionDays: number;
}
