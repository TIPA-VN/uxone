// Shared Types for Projects and Tasks
import { APP_CONFIG } from '@/config/app';

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  departments: string[];
  approvalState?: Record<string, any>;
  ownerId?: string;
  requestDate?: string;
  departmentDueDates?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    completedTasks: number;
  };
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    username: string;
    department: string;
    departmentName: string;
  };
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    username: string;
    department: string;
    departmentName: string;
  };
  assignedDepartments: string[];
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestDate: string;
  dueDate?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: string;
    description?: string;
  };
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  username: string;
  department: string | null;
  departmentName: string | null;
  role: string | null;
  hashedPassword: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Document = {
  id: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  version?: number;
  department?: string;
  workflowState?: string;
  metadata?: { 
    type?: string; 
    description?: string; 
    approved?: boolean;
    production?: boolean;
    pageNumber?: number;
    [key: string]: unknown 
  };
};

export type TaskComment = {
  id: string;
  taskId: string;
  text: string;
  authorId: string;
  author: string;
  timestamp: string;
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
};

export type TaskSubtask = {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  assigneeId?: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  myTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalHours: number;
  estimatedHours: number;
  efficiency: number;
};

export type TeamKPI = {
  totalMembers: number;
  activeMembers: number;
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  completedProjects: number;
  teamEfficiency: number;
  averageTaskCompletion: number;
  averageProjectCompletion: number;
};

export type TeamMember = {
  id: string;
  name: string;
  username: string;
  department: string;
  departmentName: string;
  role: string;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    efficiency: number;
  };
  projectStats: {
    total: number;
    completed: number;
    active: number;
    efficiency: number;
  };
};

// Re-export from config for convenience
export const DEPARTMENTS = APP_CONFIG.departments;
export type Department = typeof APP_CONFIG.departments[number];
export type Role = keyof typeof APP_CONFIG.roles;
export type TaskPriority = typeof APP_CONFIG.tasks.priorities[number]["value"];
export type TaskStatus = typeof APP_CONFIG.tasks.statuses[number]["value"];
export type ProjectStatus = typeof APP_CONFIG.projects.statuses[number]["value"];
export type ApprovalState = typeof APP_CONFIG.projects.approvalStates[number]["value"]; 