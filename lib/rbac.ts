import { ROLES } from "./zod";

// Define all possible permissions
export const PERMISSIONS = {
  // User management
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",

  // LVM permissions
  VIEW_LVM: "view_lvm",
  MANAGE_LVM: "manage_lvm",
  APPROVE_LVM: "approve_lvm",

  // CS permissions
  VIEW_CS: "view_cs",
  MANAGE_CS: "manage_cs",
  APPROVE_CS: "approve_cs",

  // Purchasing permissions
  VIEW_PURCHASING: "view_purchasing",
  MANAGE_PURCHASING: "manage_purchasing",
  APPROVE_PURCHASING: "approve_purchasing",

  // Dashboard permissions
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_ANNOUNCEMENTS: "manage_announcements",
} as const;

// Define departments
export const DEPARTMENTS = {
  LVM_EXPAT: "LVM-EXPAT",
  LVM_CS: "LVM-CS",
  LVM_PURCHASING: "LVM-PURCHASING",
  LVM_LOGISTICS: "LVM-LOGISTICS",
} as const;

// Define department-specific permissions
export const DEPARTMENT_PERMISSIONS: Record<string, string[]> = {
  [DEPARTMENTS.LVM_EXPAT]: [
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.MANAGE_LVM,
    PERMISSIONS.APPROVE_LVM,
    PERMISSIONS.VIEW_CS,
    PERMISSIONS.APPROVE_CS,
    PERMISSIONS.VIEW_PURCHASING,
    PERMISSIONS.APPROVE_PURCHASING,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
  ],
  [DEPARTMENTS.LVM_CS]: [
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.VIEW_CS,
    PERMISSIONS.MANAGE_CS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  [DEPARTMENTS.LVM_PURCHASING]: [
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.VIEW_PURCHASING,
    PERMISSIONS.MANAGE_PURCHASING,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  [DEPARTMENTS.LVM_LOGISTICS]: [
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.VIEW_CS,
    PERMISSIONS.VIEW_PURCHASING,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admins have all permissions
  [ROLES.SENIOR_MANAGER]: Object.values(PERMISSIONS), // Super admins have all permissions
  // [ROLES.SENIOR_MANAGER]: [
  //   PERMISSIONS.VIEW_USERS,
  //   PERMISSIONS.VIEW_LVM,
  //   PERMISSIONS.APPROVE_LVM,
  //   PERMISSIONS.VIEW_CS,
  //   PERMISSIONS.APPROVE_CS,
  //   PERMISSIONS.VIEW_PURCHASING,
  //   PERMISSIONS.APPROVE_PURCHASING,
  //   PERMISSIONS.VIEW_DASHBOARD,
  //   PERMISSIONS.MANAGE_ANNOUNCEMENTS,
  // ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.MANAGE_LVM,
    PERMISSIONS.VIEW_CS,
    PERMISSIONS.MANAGE_CS,
    PERMISSIONS.VIEW_PURCHASING,
    PERMISSIONS.MANAGE_PURCHASING,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  [ROLES.SUPERVISOR]: [
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.MANAGE_LVM,
    PERMISSIONS.VIEW_CS,
    PERMISSIONS.MANAGE_CS,
    PERMISSIONS.VIEW_PURCHASING,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_LVM,
    PERMISSIONS.VIEW_CS,
    PERMISSIONS.VIEW_PURCHASING,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// Helper function to check if a user has a specific permission based on both role and department
export function hasPermission(userRole: string, permission: string, userDepartment?: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] ?? [];
  const departmentPermissions = userDepartment ? (DEPARTMENT_PERMISSIONS[userDepartment] ?? []) : [];

  // User has permission if either their role or department grants it
  return rolePermissions.includes(permission) || departmentPermissions.includes(permission);
}

// Helper function to check if a user has any of the required permissions
export function hasAnyPermission(userRole: string, permissions: string[], userDepartment?: string): boolean {
  return permissions.some(permission => hasPermission(userRole, permission, userDepartment));
}

// Helper function to check if a user has all of the required permissions
export function hasAllPermissions(userRole: string, permissions: string[], userDepartment?: string): boolean {
  return permissions.every(permission => hasPermission(userRole, permission, userDepartment));
}

// React hook for checking permissions
export function usePermissions(userRole?: string, userDepartment?: string) {
  return {
    hasPermission: (permission: string) => hasPermission(userRole ?? "", permission, userDepartment),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(userRole ?? "", permissions, userDepartment),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(userRole ?? "", permissions, userDepartment),
    userDepartment,
  };
} 