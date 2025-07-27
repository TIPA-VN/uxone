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
  createdAt?: string;
  updatedAt?: string;
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

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assignee_name?: string;
  assignee_username?: string;
  assignee_department?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  username: string;
  department: string;
  departmentName: string;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: string;
  type: 'comment' | 'update';
};

export type TaskForm = {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string;
  dueDate: string;
  estimatedHours: string;
  tags: string[];
};

export type DocumentMetadata = {
  type: string;
  description: string;
};

export const DEPARTMENTS = [
  { value: "logistics", label: "Logistics" },
  { value: "procurement", label: "Procurement" },
  { value: "pc", label: "Production Planning" },
  { value: "qa", label: "Quality Assurance" },
  { value: "qc", label: "Quality Control" },
  { value: "pm", label: "Production Maintenance" },
  { value: "fm", label: "Facility Management" },
  { value: "hra", label: "Human Resources" },
  { value: "cs", label: "Customer Service" },
  { value: "sales", label: "Sales" },
  { value: "LVM-EXPAT", label: "LVM EXPATS" },
] as const;

export type Department = typeof DEPARTMENTS[number]['value']; 