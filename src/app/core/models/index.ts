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
  category: string;
  status: string;
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
  escalateTo?: string;
  assignedToName?: string;
  escalateToName?: string;
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

export interface ComplaintStatus {
  clientId: string;
  createdAt: string;
  createdBy: string;
  currentStatusId: number;
  description: string;
  id: string;
  name: string;
  title: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Employee {
  clientId: string;
  email: string;
  id: string;
  mobileNumber: string | null;
  name: string | null;
  password: string;
  roles: string;
  status: boolean;
  userId: string;
  version: number;
}

export type IssueStatus = string;
export type IssuePriority = Issue['priority'];
export type IssueCategory = Issue['category'];