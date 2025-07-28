import { useSession } from 'next-auth/react';
import { 
  canUserAccessPage, 
  canUserCreateTicket, 
  canUserUpdateTicket, 
  canUserDeleteTicket, 
  canUserAssignTicket, 
  canUserResolveTicket, 
  canUserEscalateTicket, 
  canUserViewReports,
  canUserAccessTicket,
  canTransitionTicketStatus,
  canAssignTicketToUser,
  canUserAdminHelpdesk
} from '@/lib/rbac';
import { getHelpdeskPermissionsForRole, getHelpdeskPermissionLevel } from '@/config/app';

export const useHelpdesk = () => {
  const { data: session } = useSession();

  const userRole = session?.user?.role;
  const userDepartment = session?.user?.department || 'UNKNOWN';
  const userId = session?.user?.id;

  // Page access
  const canAccessHelpdesk = userRole ? canUserAccessPage(userRole, 'helpdesk') : false;

  // Get full permission matrix for the user's role
  const userPermissions = userRole ? getHelpdeskPermissionsForRole(userRole) : null;
  const permissionLevel = userRole ? getHelpdeskPermissionLevel(userRole) : 'OPERATIONS';

  // Ticket operations using permission matrix
  const canCreateTickets = userRole ? canUserCreateTicket(userRole) : false;
  const canUpdateTickets = userRole ? canUserUpdateTicket(userRole, {} as any, userId, userDepartment) : false;
  const canDeleteTickets = userRole ? canUserDeleteTicket(userRole) : false;
  const canAssignTickets = userRole ? canUserAssignTicket(userRole) : false;
  const canResolveTickets = userRole ? canUserResolveTicket(userRole, {} as any, userId, userDepartment) : false;
  const canEscalateTickets = userRole ? canUserEscalateTicket(userRole) : false;
  const canViewReports = userRole ? canUserViewReports(userRole) : false;
  const canAdminHelpdesk = userRole ? canUserAdminHelpdesk(userRole) : false;

  // Helper functions
  const canAccessTicket = (ticket: any) => {
    return userRole ? canUserAccessTicket(userRole, userDepartment, ticket, userId) : false;
  };

  const canUpdateTicket = (ticket: any) => {
    return userRole ? canUserUpdateTicket(userRole, ticket, userId, userDepartment) : false;
  };

  const canResolveTicket = (ticket: any) => {
    return userRole ? canUserResolveTicket(userRole, ticket, userId, userDepartment) : false;
  };

  const canTransitionStatus = (currentStatus: string, newStatus: string) => {
    return userRole ? canTransitionTicketStatus(userRole, currentStatus, newStatus) : false;
  };

  const canAssignToUser = (assigneeRole: string, assigneeDepartment: string) => {
    return userRole ? canAssignTicketToUser(userRole, assigneeRole, userDepartment, assigneeDepartment) : false;
  };

  // User role information
  const isAdmin = userRole === 'ADMIN' || userRole === 'GENERAL_DIRECTOR' || userRole === 'GENERAL_MANAGER';
  const isManager = userRole?.includes('MANAGER') || false;
  const isSupervisor = userRole?.includes('SUPERVISOR') || false;
  const isSpecialist = userRole?.includes('SPECIALIST') || false;
  const isEngineer = userRole?.includes('ENGINEER') || false;

  // Permission level information
  const isExecutive = permissionLevel === 'EXECUTIVE';
  const isSeniorManagement = permissionLevel === 'SENIOR_MANAGEMENT';
  const isManagement = permissionLevel === 'MANAGEMENT';
  const isAssistantManagement = permissionLevel === 'ASSISTANT_MANAGEMENT';
  const isSupervision = permissionLevel === 'SUPERVISION';
  const isSpecialistLevel = permissionLevel === 'SPECIALIST';
  const isEngineeringLevel = permissionLevel === 'ENGINEERING';
  const isStaffLevel = permissionLevel === 'STAFF';
  const isOperationsLevel = permissionLevel === 'OPERATIONS';

  return {
    // User info
    userRole,
    userDepartment,
    userId,
    session,

    // Page access
    canAccessHelpdesk,

    // Permission matrix
    userPermissions,
    permissionLevel,

    // Ticket permissions
    canCreateTickets,
    canUpdateTickets,
    canDeleteTickets,
    canAssignTickets,
    canResolveTickets,
    canEscalateTickets,
    canViewReports,
    canAdminHelpdesk,

    // Helper functions
    canAccessTicket,
    canUpdateTicket,
    canResolveTicket,
    canTransitionStatus,
    canAssignToUser,

    // Role checks
    isAdmin,
    isManager,
    isSupervisor,
    isSpecialist,
    isEngineer,

    // Permission level checks
    isExecutive,
    isSeniorManagement,
    isManagement,
    isAssistantManagement,
    isSupervision,
    isSpecialistLevel,
    isEngineeringLevel,
    isStaffLevel,
    isOperationsLevel,

    // Loading state
    isLoading: !session,
  };
}; 