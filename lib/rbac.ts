// Define the enums locally to match Prisma schema
export enum EmployeePosition {
  ASSISTANT_GENERAL_MANAGER = "ASSISTANT_GENERAL_MANAGER",
  ASSISTANT_GENERAL_MANAGER_2 = "ASSISTANT_GENERAL_MANAGER_2",
  ASSISTANT_MANAGER = "ASSISTANT_MANAGER",
  ASSISTANT_MANAGER_2 = "ASSISTANT_MANAGER_2",
  ASSISTANT_SENIOR_MANAGER = "ASSISTANT_SENIOR_MANAGER",
  ASSOCIATE = "ASSOCIATE",
  CHIEF_SPECIALIST = "CHIEF_SPECIALIST",
  ENGINEER = "ENGINEER",
  GENERAL_DIRECTOR = "GENERAL_DIRECTOR",
  GENERAL_MANAGER = "GENERAL_MANAGER",
  INTERN = "INTERN",
  LINE_LEADER = "LINE_LEADER",
  MANAGER = "MANAGER",
  MANAGER_2 = "MANAGER_2",
  OPERATOR = "OPERATOR",
  SENIOR_ASSOCIATE = "SENIOR_ASSOCIATE",
  SENIOR_ENGINEER = "SENIOR_ENGINEER",
  SENIOR_MANAGER = "SENIOR_MANAGER",
  SENIOR_MANAGER_2 = "SENIOR_MANAGER_2",
  SENIOR_OPERATOR = "SENIOR_OPERATOR",
  SENIOR_SPECIALIST = "SENIOR_SPECIALIST",
  SENIOR_SPECIALIST_2 = "SENIOR_SPECIALIST_2",
  SENIOR_STAFF = "SENIOR_STAFF",
  SPECIALIST = "SPECIALIST",
  SPECIALIST_2 = "SPECIALIST_2",
  STAFF = "STAFF",
  SUPERVISOR = "SUPERVISOR",
  SUPERVISOR_2 = "SUPERVISOR_2",
  TECHNICAL_SPECIALIST = "TECHNICAL_SPECIALIST",
  TECHNICIAN = "TECHNICIAN"
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER"
}

// Define all possible permissions
export const Permissions = {
  // Project permissions
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_APPROVE: "project:approve",
  
  // Document permissions
  DOCUMENT_CREATE: "document:create",
  DOCUMENT_READ: "document:read",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",
  
  // User management permissions
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  
  // Department permissions
  DEPARTMENT_MANAGE: "department:manage",
  
  // System permissions
  SYSTEM_ADMIN: "system:admin",
  SYSTEM_SETTINGS: "system:settings",
} as const;

type Permission = typeof Permissions[keyof typeof Permissions];

// Define position-based permissions
const positionPermissions: Record<EmployeePosition, Permission[]> = {
  GENERAL_DIRECTOR: [
    Permissions.SYSTEM_ADMIN,
    Permissions.SYSTEM_SETTINGS,
    Permissions.PROJECT_APPROVE,
    Permissions.DEPARTMENT_MANAGE,
  ],
  
  GENERAL_MANAGER: [
    Permissions.SYSTEM_ADMIN,
    Permissions.SYSTEM_SETTINGS,
    Permissions.PROJECT_APPROVE,
    Permissions.DEPARTMENT_MANAGE,
  ],
  
  ASSISTANT_GENERAL_MANAGER: [
    Permissions.PROJECT_APPROVE,
    Permissions.DEPARTMENT_MANAGE,
    Permissions.SYSTEM_SETTINGS,
  ],
  ASSISTANT_GENERAL_MANAGER_2: [
    Permissions.PROJECT_APPROVE,
    Permissions.DEPARTMENT_MANAGE,
    Permissions.SYSTEM_SETTINGS,
  ],
  
  SENIOR_MANAGER: [
    Permissions.PROJECT_APPROVE,
    Permissions.DEPARTMENT_MANAGE,
    Permissions.PROJECT_CREATE,
  ],
  SENIOR_MANAGER_2: [
    Permissions.PROJECT_APPROVE,
    Permissions.DEPARTMENT_MANAGE,
    Permissions.PROJECT_CREATE,
  ],
  
  MANAGER: [
    Permissions.PROJECT_APPROVE,
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  MANAGER_2: [
    Permissions.PROJECT_APPROVE,
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  
  ASSISTANT_MANAGER: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  ASSISTANT_MANAGER_2: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  
  ASSISTANT_SENIOR_MANAGER: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
    Permissions.PROJECT_APPROVE,
  ],
  
  SENIOR_ENGINEER: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  
  ENGINEER: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  
  SENIOR_SPECIALIST: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  SENIOR_SPECIALIST_2: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
  ],
  
  CHIEF_SPECIALIST: [
    Permissions.PROJECT_CREATE,
    Permissions.DOCUMENT_CREATE,
    Permissions.PROJECT_APPROVE,
  ],
  
  SPECIALIST: [
    Permissions.DOCUMENT_CREATE,
  ],
  SPECIALIST_2: [
    Permissions.DOCUMENT_CREATE,
  ],
  
  TECHNICAL_SPECIALIST: [
    Permissions.DOCUMENT_CREATE,
  ],
  
  SENIOR_ASSOCIATE: [
    Permissions.DOCUMENT_CREATE,
  ],
  
  ASSOCIATE: [
    Permissions.DOCUMENT_CREATE,
  ],
  
  SENIOR_STAFF: [
    Permissions.DOCUMENT_CREATE,
  ],
  
  STAFF: [
    Permissions.DOCUMENT_CREATE,
  ],
  
  SENIOR_OPERATOR: [
    Permissions.DOCUMENT_READ,
  ],
  
  OPERATOR: [
    Permissions.DOCUMENT_READ,
  ],
  
  SUPERVISOR: [
    Permissions.DOCUMENT_CREATE,
    Permissions.PROJECT_CREATE,
  ],
  SUPERVISOR_2: [
    Permissions.DOCUMENT_CREATE,
    Permissions.PROJECT_CREATE,
  ],
  
  LINE_LEADER: [
    Permissions.DOCUMENT_READ,
  ],
  
  TECHNICIAN: [
    Permissions.DOCUMENT_READ,
  ],
  
  INTERN: [
    Permissions.DOCUMENT_READ,
  ],
};

// Define role-based permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(Permissions),
  ADMIN: [
    Permissions.PROJECT_CREATE,
    Permissions.PROJECT_READ,
    Permissions.PROJECT_UPDATE,
    Permissions.PROJECT_DELETE,
    Permissions.DOCUMENT_CREATE,
    Permissions.DOCUMENT_READ,
    Permissions.DOCUMENT_UPDATE,
    Permissions.DOCUMENT_DELETE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.DEPARTMENT_MANAGE,
  ],
  MANAGER: [
    Permissions.PROJECT_CREATE,
    Permissions.PROJECT_READ,
    Permissions.PROJECT_UPDATE,
    Permissions.DOCUMENT_CREATE,
    Permissions.DOCUMENT_READ,
    Permissions.DOCUMENT_UPDATE,
    Permissions.USER_READ,
  ],
  USER: [
    Permissions.PROJECT_READ,
    Permissions.DOCUMENT_READ,
    Permissions.USER_READ,
  ],
};

export interface UserWithPermissions {
  id: string;
  role: UserRole;
  position: EmployeePosition;
  department?: string | null;
}

export function hasPermission(user: UserWithPermissions, permission: Permission): boolean {
  // Super admin has all permissions
  if (user.role === "SUPER_ADMIN") return true;
  
  // Check role-based permissions
  const userRolePermissions = rolePermissions[user.role] || [];
  if (userRolePermissions.includes(permission)) return true;
  
  // Check position-based permissions
  const userPositionPermissions = positionPermissions[user.position] || [];
  if (userPositionPermissions.includes(permission)) return true;
  
  return false;
}

export function getUserPermissions(user: UserWithPermissions): Permission[] {
  const permissions = new Set<Permission>();
  
  // Add role-based permissions
  rolePermissions[user.role]?.forEach(p => permissions.add(p));
  
  // Add position-based permissions
  positionPermissions[user.position]?.forEach(p => permissions.add(p));
  
  return Array.from(permissions);
}

// Helper to check multiple permissions
export function hasPermissions(user: UserWithPermissions, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(user, permission));
}

// Helper to check if user can manage a department
export function canManageDepartment(user: UserWithPermissions, targetDepartment: string): boolean {
  // Super admin can manage all departments
  if (user.role === "SUPER_ADMIN") return true;
  
  // Check if user has department management permission and is in the same department
  if (hasPermission(user, Permissions.DEPARTMENT_MANAGE)) {
    return user.department === targetDepartment;
  }
  
  return false;
}

// Helper to check if user can approve projects
export function canApproveProjects(user: UserWithPermissions): boolean {
  return hasPermission(user, Permissions.PROJECT_APPROVE);
}

// Helper to check if user can create projects
export function canCreateProjects(user: UserWithPermissions): boolean {
  return hasPermission(user, Permissions.PROJECT_CREATE);
}

// Helper to check if user can manage documents
export function canManageDocuments(user: UserWithPermissions): boolean {
  return hasPermissions(user, [
    Permissions.DOCUMENT_CREATE,
    Permissions.DOCUMENT_UPDATE,
    Permissions.DOCUMENT_DELETE,
  ]);
} 