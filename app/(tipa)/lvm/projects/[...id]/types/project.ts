export type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  departments: string[];
  approvalState?: Record<string, string>;
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
  fileType?: string;
  size?: number;
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

// Document Types Configuration
export const DOCUMENT_TYPES = [
  { value: "general", label: "General", description: "General purpose documents" },
  { value: "drawing", label: "Drawing", description: "Technical drawings and CAD files" },
  { value: "specification", label: "Specification", description: "Technical specifications and requirements" },
  { value: "procedure", label: "Procedure", description: "Work procedures and instructions" },
  { value: "manual", label: "Manual", description: "User manuals and guides" },
  { value: "report", label: "Report", description: "Reports and analysis documents" },
  { value: "contract", label: "Contract", description: "Contracts and agreements" },
  { value: "quote", label: "Quote", description: "Quotes and pricing documents" },
  { value: "invoice", label: "Invoice", description: "Invoices and billing documents" },
  { value: "certificate", label: "Certificate", description: "Certificates and compliance documents" },
  { value: "test", label: "Test", description: "Test results and validation documents" },
  { value: "inspection", label: "Inspection", description: "Inspection reports and checklists" },
  { value: "quality", label: "Quality", description: "Quality control documents" },
  { value: "safety", label: "Safety", description: "Safety documentation and procedures" },
  { value: "maintenance", label: "Maintenance", description: "Maintenance schedules and records" },
  { value: "training", label: "Training", description: "Training materials and records" },
  { value: "policy", label: "Policy", description: "Company policies and guidelines" },
  { value: "form", label: "Form", description: "Forms and templates" },
  { value: "template", label: "Template", description: "Document templates" },
  { value: "other", label: "Other", description: "Other document types" },
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number]['value'];

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
  role?: string;
  isActive?: boolean;
  email?: string;
  centralDepartment?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Comment = {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    department: string;
    departmentName: string;
  };
  authorId: string;
  createdAt: string;
  updatedAt: string;
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
  { value: "is", label: "Information Systems" },
  { value: "LVM-EXPAT", label: "LVM EXPATS" },
] as const;

export type Department = typeof DEPARTMENTS[number]['value']; 