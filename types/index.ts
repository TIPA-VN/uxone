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
  documentTemplate?: string;
  documentNumber?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    completedTasks: number;
  };
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: string;
  assigneeId?: string;
  ownerId?: string;
  creatorId?: string;
  sourceTicketId?: string;
  ticketIntegration?: any;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  parentTaskId?: string;
  project?: Project;
  assignee?: User;
  owner?: User;
  creator?: User;
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  legacyComments?: Comment[];
  subtasks?: Task[];
  parentTask?: Task;
}

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

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
  read: boolean;
  createdAt: string;
  hidden: boolean;
  user?: User;
  serviceNotification?: {
    serviceType: string;
    priority: string;
    expiresAt?: string;
    metadata: Record<string, any>;
    createdAt: string;
  };
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
  content: string;
  authorId: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy: User;
  createdAt: string;
};

export type TaskDependency = {
  id: string;
  dependentTaskId: string;
  dependencyTaskId: string;
  dependentTask: Task;
  dependencyTask: Task;
  createdAt: string;
};

export type Comment = {
  id: string;
  content: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
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
export const DEPARTMENTS = APP_CONFIG.departments.list;
export type Department = typeof APP_CONFIG.departments.list[number];
export type Role = keyof typeof APP_CONFIG.roles;
export type TaskPriority = typeof APP_CONFIG.tasks.priorities[number]["value"];
export type TaskStatus = typeof APP_CONFIG.tasks.statuses[number]["value"];
export type ProjectStatus = typeof APP_CONFIG.projects.statuses[number]["value"];
export type ApprovalState = typeof APP_CONFIG.projects.approvalStates[number]["value"]; 