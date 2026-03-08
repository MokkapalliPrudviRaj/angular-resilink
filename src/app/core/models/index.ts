export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'resident' | 'admin';
  roomNumber?: string;
  apartment?: string;
  clientId?: string;
  customerId?: string;
  username?: string;
  token?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'other';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  statusId: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  eta?: string;
  assignedTo?: string;
  residentId: string;
  residentName: string;
  apartment: string;
  images: string[];
  comments: Comment[];
  notes: string[];
  isCommonArea?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: 'resident' | 'admin';
  text: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  activeIssues: number;
}

export type IssueStatus = Issue['status'];
export type IssuePriority = Issue['priority'];
export type IssueCategory = Issue['category'];