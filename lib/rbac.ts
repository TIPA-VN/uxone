import { APP_CONFIG, canAccessFeature, canAccessPage, canAccessApi, hasPermission } from '@/config/app';
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

      const userRole = session.user.role as keyof typeof APP_CONFIG.roles;
      
      if (!userRole || !APP_CONFIG.roles[userRole]) {
        return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
      }

      // Check specific permission if provided
      if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      return handler(request, ...args);
    } catch (error) {
      console.error('RBAC middleware error:', error);
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

      const userRole = session.user.role as keyof typeof APP_CONFIG.roles;
      
      if (!userRole || !APP_CONFIG.roles[userRole]) {
        return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
      }

      // Check API endpoint access
      if (!canAccessApi(userRole, endpoint, method)) {
        return NextResponse.json({ error: "Access denied for this endpoint" }, { status: 403 });
      }

      return handler(request, ...args);
    } catch (error) {
      console.error('RBAC middleware error:', error);
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