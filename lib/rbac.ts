import { APP_CONFIG, canAccessFeature, canAccessPage, canAccessApi, hasPermission, Role, getHelpdeskPermissionsForRole, canUserPerformHelpdeskAction, getHelpdeskDepartmentScope, mapRoleToConfigKey, mapUserDepartmentToCode } from '@/config/app';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';

// RBAC Middleware for API routes
export const withRBAC = (handler: Function, requiredPermission?: string) => {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Map the user role to the correct config key
      const mappedRole = mapRoleToConfigKey(session.user.role) as keyof typeof APP_CONFIG.roles;
      
      if (!mappedRole || !APP_CONFIG.roles[mappedRole]) {
        return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
      }

      // Check specific permission if provided
      if (requiredPermission && !hasPermission(mappedRole, requiredPermission)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      return handler(request, ...args);
    } catch (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
};

// RBAC Middleware for specific API endpoints
export const withEndpointRBAC = (handler: Function, endpoint: keyof typeof APP_CONFIG.rbac.api, method: string) => {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Map the user role to the correct config key
      const mappedRole = mapRoleToConfigKey(session.user.role) as keyof typeof APP_CONFIG.roles;
      
      if (!mappedRole || !APP_CONFIG.roles[mappedRole]) {
        console.error('Invalid user role:', session.user.role, 'mapped to:', mappedRole);
        return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
      }

      // Check API endpoint access
      if (!canAccessApi(mappedRole, endpoint, method)) {
        return NextResponse.json({ error: "Access denied for this endpoint" }, { status: 403 });
      }

      return handler(request, ...args);
    } catch (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
};

// RBAC Hook for client-side checks
export const useRBAC = () => {
  const checkPermission = (permission: string) => {
    // This would be used in client components with session data
    return true; // Placeholder - implement with actual session data
  };

  const checkFeatureAccess = (feature: keyof typeof APP_CONFIG.rbac.features) => {
    // This would be used in client components with session data
    return true; // Placeholder - implement with actual session data
  };

  const checkPageAccess = (page: keyof typeof APP_CONFIG.rbac.pages) => {
    // This would be used in client components with session data
    return true; // Placeholder - implement with actual session data
  };

  return {
    checkPermission,
    checkFeatureAccess,
    checkPageAccess,
  };
};

// RBAC Component wrapper
export const withPageRBAC = (Component: React.ComponentType<any>, requiredPage: keyof typeof APP_CONFIG.rbac.pages) => {
  return (props: any) => {
    // This would check page access and conditionally render
    // For now, just render the component
    return React.createElement(Component, props);
  };
};

// Utility functions for role-based UI rendering
export const canUserAccessFeature = (userRole: string, feature: keyof typeof APP_CONFIG.rbac.features) => {
  return canAccessFeature(userRole as keyof typeof APP_CONFIG.roles, feature);
};

export const canUserAccessPage = (userRole: string, page: keyof typeof APP_CONFIG.rbac.pages) => {
  return canAccessPage(userRole as keyof typeof APP_CONFIG.roles, page);
};

export const getUserPermissions = (userRole: string) => {
  const role = APP_CONFIG.roles[userRole as keyof typeof APP_CONFIG.roles];
  return role?.permissions || [];
};

export const isUserAdmin = (userRole: string) => {
  return userRole === 'ADMIN';
};

export const isUserManager = (userRole: string) => {
  return ['ADMIN', 'SENIOR_MANAGER', 'MANAGER'].includes(userRole);
};

export const isUserSupervisor = (userRole: string) => {
  return ['ADMIN', 'SENIOR_MANAGER', 'MANAGER', 'SUPERVISOR'].includes(userRole);
};

// Department-based access control
export const canUserAccessDepartment = (userDepartment: string, targetDepartment: string) => {
  // Users can access their own department
  if (userDepartment.toLowerCase() === targetDepartment.toLowerCase()) {
    return true;
  }
  
  // Admins can access all departments
  return false; // Add logic for cross-department access if needed
};

// Project-based access control
export const canUserAccessProject = (userRole: string, userDepartment: string, projectDepartments: string[]) => {
  // Admins can access all projects
  if (isUserAdmin(userRole)) {
    return true;
  }
  
  // Check if user's department is in project departments
  return projectDepartments.some(dept => 
    dept.toLowerCase() === userDepartment.toLowerCase()
  );
};

// Task-based access control
export const canUserAccessTask = (userRole: string, userDepartment: string, taskDepartments: string[], taskAssigneeId?: string, userId?: string) => {
  // Admins can access all tasks
  if (isUserAdmin(userRole)) {
    return true;
  }
  
  // Users can access tasks assigned to them
  if (taskAssigneeId && taskAssigneeId === userId) {
    return true;
  }
  
  // Check if user's department is in task departments
  return taskDepartments.some(dept => 
    dept.toLowerCase() === userDepartment.toLowerCase()
  );
}; 

// Helpdesk-specific access control functions
export const canUserAccessTicket = (userRole: string, userDepartment: string, ticket: any, userId?: string) => {
  // Map user department to standardized code
  const mappedDepartment = mapUserDepartmentToCode(userDepartment);
  
  // Admins can access all tickets
  if (isUserAdmin(userRole)) {
    return true;
  }
  
  // Users can access tickets they created or are assigned to
  if (ticket.createdById === userId || ticket.assignedToId === userId) {
    return true;
  }
  
  // Check department scope based on permission matrix
  const departmentScope = getHelpdeskDepartmentScope(userRole);
  if (departmentScope === "all") {
    return true;
  }
  
  // IS department members can read all tickets
  if (mappedDepartment === 'IS') {
    return true;
  }
  
  // Department-based access for own department
  if (departmentScope === "own") {
    return ticket.assignedTeam === mappedDepartment;
  }
  
  return false;
};

export const canUserCreateTicket = (userRole: string) => {
  return canUserPerformHelpdeskAction(userRole, 'create');
};

export const canUserUpdateTicket = (userRole: string, ticket: any, userId?: string, userDepartment?: string) => {
  // Map user department to standardized code
  const mappedDepartment = userDepartment ? mapUserDepartmentToCode(userDepartment) : undefined;
  
  // Check basic update permission
  if (!canUserPerformHelpdeskAction(userRole, 'update')) {
    return false;
  }
  
  // Admins can update all tickets
  if (isUserAdmin(userRole)) {
    return true;
  }
  
  // Users can update tickets they created or are assigned to
  if (ticket.createdById === userId || ticket.assignedToId === userId) {
    return true;
  }
  
  // Check department scope
  const departmentScope = getHelpdeskDepartmentScope(userRole);
  if (departmentScope === "all") {
    return true;
  }
  
  // IS department members can only update tickets they created or are assigned to
  if (mappedDepartment === 'IS') {
    return ticket.createdById === userId || ticket.assignedToId === userId;
  }
  
  if (departmentScope === "own" && mappedDepartment) {
    return ticket.assignedTeam === mappedDepartment;
  }
  
  return false;
};

export const canUserAssignTicket = (userRole: string) => {
  return canUserPerformHelpdeskAction(userRole, 'assign');
};

export const canUserResolveTicket = (userRole: string, ticket: any, userId?: string, userDepartment?: string) => {
  // Map user department to standardized code
  const mappedDepartment = userDepartment ? mapUserDepartmentToCode(userDepartment) : undefined;
  
  // Check basic resolve permission
  if (!canUserPerformHelpdeskAction(userRole, 'resolve')) {
    return false;
  }
  
  // Admins can resolve all tickets
  if (isUserAdmin(userRole)) {
    return true;
  }
  
  // Users can resolve tickets they created or are assigned to
  if (ticket.createdById === userId || ticket.assignedToId === userId) {
    return true;
  }
  
  // Check department scope
  const departmentScope = getHelpdeskDepartmentScope(userRole);
  if (departmentScope === "all") {
    return true;
  }
  
  // IS department members can only resolve tickets they created or are assigned to
  if (mappedDepartment === 'IS') {
    return ticket.createdById === userId || ticket.assignedToId === userId;
  }
  
  if (departmentScope === "own" && mappedDepartment) {
    return ticket.assignedTeam === mappedDepartment;
  }
  
  return false;
};

export const canUserDeleteTicket = (userRole: string) => {
  return canUserPerformHelpdeskAction(userRole, 'delete');
};

export const canUserEscalateTicket = (userRole: string) => {
  return canUserPerformHelpdeskAction(userRole, 'escalate');
};

export const canUserViewReports = (userRole: string) => {
  return canUserPerformHelpdeskAction(userRole, 'reports');
};

export const canUserAdminHelpdesk = (userRole: string) => {
  return canUserPerformHelpdeskAction(userRole, 'admin');
};

// Helper functions for role checking
export const isUserSpecialist = (userRole: string) => {
  return ['CHIEF_SPECIALIST', 'TECHNICAL_SPECIALIST', 'SENIOR_SPECIALIST', 'SENIOR_SPECIALIST_2', 'SPECIALIST', 'SPECIALIST_2'].includes(userRole);
};

export const isUserEngineer = (userRole: string) => {
  return ['SENIOR_ENGINEER', 'ENGINEER', 'TECHNICIAN'].includes(userRole);
};

// Department-based ticket filtering
export const getTicketsForUser = async (prisma: any, userId: string, userRole: string, userDepartment: string) => {
  // Map user department to standardized code
  const mappedDepartment = mapUserDepartmentToCode(userDepartment);
  
  const baseQuery: any = {
    OR: [
      { createdById: userId },
      { assignedToId: userId }
    ]
  };
  
  // Add department-based filtering for managers and supervisors
  if (isUserManager(userRole) || isUserSupervisor(userRole)) {
    baseQuery.OR.push({ assignedTeam: mappedDepartment });
  }
  
  // Add department-based filtering for specialists and engineers
  // IS department members (specialists and engineers) can see all tickets
  if ((isUserSpecialist(userRole) || isUserEngineer(userRole)) && mappedDepartment !== 'IS') {
    baseQuery.OR.push({ assignedTeam: mappedDepartment });
  }
  
  // Admins and IS department members see all tickets
  if (isUserAdmin(userRole) || mappedDepartment === 'IS') {
    return await prisma.ticket.findMany({
      include: {
        assignedTo: true,
        createdBy: true,
        comments: {
          include: {
            author: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  
  return await prisma.ticket.findMany({
    where: baseQuery,
    include: {
      assignedTo: true,
      createdBy: true,
      comments: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      attachments: true,
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

// Ticket assignment validation
export const canAssignTicketToUser = (assignerRole: string, assigneeRole: string, assignerDepartment: string, assigneeDepartment: string) => {
  // Map departments to standardized codes
  const mappedAssignerDepartment = mapUserDepartmentToCode(assignerDepartment);
  const mappedAssigneeDepartment = mapUserDepartmentToCode(assigneeDepartment);
  
  // Admins can assign to anyone
  if (isUserAdmin(assignerRole)) {
    return true;
  }
  
  // IS department members can assign to anyone (for ticket reassignment)
  if (mappedAssignerDepartment === 'IS') {
    return true;
  }
  
  // Managers can assign within their department
  if (isUserManager(assignerRole)) {
    return mappedAssignerDepartment === mappedAssigneeDepartment;
  }
  
  // Supervisors can assign within their department
  if (isUserSupervisor(assignerRole)) {
    return mappedAssignerDepartment === mappedAssigneeDepartment;
  }
  
  return false;
};

// Ticket status transition validation
export const canTransitionTicketStatus = (userRole: string, currentStatus: string, newStatus: string) => {
  const allowedTransitions: { [key: string]: string[] } = {
    'OPEN': ['IN_PROGRESS', 'PENDING', 'RESOLVED'],
    'IN_PROGRESS': ['PENDING', 'RESOLVED'],
    'PENDING': ['IN_PROGRESS', 'RESOLVED'],
    'RESOLVED': ['CLOSED', 'IN_PROGRESS'],
    'CLOSED': ['IN_PROGRESS'] // Reopen capability
  };
  
  const allowedStatuses = allowedTransitions[currentStatus] || [];
  
  if (!allowedStatuses.includes(newStatus)) {
    return false;
  }
  
  // Only managers and admins can close tickets
  if (newStatus === 'CLOSED' && !isUserManager(userRole) && !isUserAdmin(userRole)) {
    return false;
  }
  
  return true;
}; 