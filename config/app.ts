// Application Configuration
// Centralized configuration for departments, roles, RBAC, and other app settings

// Type definitions for better type safety
type Permission = string;
type RoleName = 
  | "ADMIN"
  | "GENERAL_DIRECTOR"
  | "GENERAL_MANAGER"
  | "ASSISTANT_GENERAL_MANAGER"
  | "ASSISTANT_GENERAL_MANAGER_2"
  | "SENIOR_MANAGER"
  | "SENIOR_MANAGER_2"
  | "ASSISTANT_SENIOR_MANAGER"
  | "MANAGER"
  | "MANAGER_2"
  | "ASSISTANT_MANAGER"
  | "ASSISTANT_MANAGER_2"
  | "SUPERVISOR"
  | "SUPERVISOR_2"
  | "LINE_LEADER"
  | "CHIEF_SPECIALIST"
  | "TECHNICAL_SPECIALIST"
  | "SENIOR_SPECIALIST"
  | "SENIOR_SPECIALIST_2"
  | "SPECIALIST"
  | "SPECIALIST_2"
  | "SENIOR_ENGINEER"
  | "ENGINEER"
  | "TECHNICIAN"
  | "SENIOR_ASSOCIATE"
  | "ASSOCIATE"
  | "SENIOR_STAFF"
  | "STAFF"
  | "SENIOR_OPERATOR"
  | "OPERATOR"
  | "INTERN";

export const APP_CONFIG = {
  // Application Info
  name: "UXOne",
  version: "1.0.0",
  description: "Unified Project Management System",

  // Department Codes Configuration
  departmentCodes: {
    IS: "Information Systems",
    QC: "Quality Control", 
    QA: "Quality Assurance",
    HR: "Human Resources",
    FIN: "Finance",
    LOG: "Logistics",
    PROC: "Procurement",
    PC: "Production Planning",
    PM: "Production Maintenance",
    FM: "Facility Management",
    CS: "Customer Service",
    RD: "Research & Development",
    MKT: "Marketing",
    SALES: "Sales",
    OPS: "Operations",
    ADMIN: "Administration"
  },

  // Department Home Pages Configuration
  departmentHomePages: {
    IS: "/lvm/helpdesk",           // Information Systems - Helpdesk management
    QC: "/lvm/quality-control",    // Quality Control - Quality management
    QA: "/lvm/quality-assurance",  // Quality Assurance - Testing & QA
    HR: "/lvm/human-resources",    // Human Resources - HR management
    FIN: "/lvm/finance",           // Finance - Financial management
    LOG: "/lvm/logistics",         // Logistics - Supply chain
    PROC: "/lvm/procurement",      // Procurement - Purchasing
    PC: "/lvm/production-planning", // Production Planning - Planning
    PM: "/lvm/production-maintenance", // Production Maintenance - Equipment
    FM: "/lvm/facility-management", // Facility Management - Infrastructure
    CS: "/lvm/customer-service",   // Customer Service - Support
    RD: "/lvm/research-development", // Research & Development - R&D
    MKT: "/lvm/marketing",         // Marketing - Marketing activities
    SALES: "/lvm/sales",           // Sales - Sales management
    OPS: "/lvm/operations",        // Operations - Operations management
    ADMIN: "/lvm/admin",           // Administration - Admin panel
    DEFAULT: "/lvm"                // Default fallback
  },

  // Departments Configuration (using department codes)
  departments: [
    {
      value: "LOG",
      label: "Logistics",
      code: "LOG",
      color: "bg-blue-500",
      description: "Supply chain and logistics management"
    },
    {
      value: "PROC",
      label: "Procurement",
      code: "PROC", 
      color: "bg-green-500",
      description: "Purchasing and procurement operations"
    },
    {
      value: "PC",
      label: "Production Planning",
      code: "PC",
      color: "bg-purple-500",
      description: "Production planning and scheduling"
    },
    {
      value: "QA",
      label: "Quality Assurance",
      code: "QA",
      color: "bg-yellow-500",
      description: "Quality assurance and testing"
    },
    {
      value: "QC",
      label: "Quality Control",
      code: "QC",
      color: "bg-orange-500",
      description: "Quality control and inspection"
    },
    {
      value: "PM",
      label: "Production Maintenance",
      code: "PM",
      color: "bg-red-500",
      description: "Production equipment maintenance"
    },
    {
      value: "FM",
      label: "Facility Management",
      code: "FM",
      color: "bg-indigo-500",
      description: "Facility and infrastructure management"
    },
    {
      value: "HR",
      label: "Human Resources",
      code: "HR",
      color: "bg-pink-500",
      description: "Human resources and personnel management"
    },
    {
      value: "CS",
      label: "Customer Service",
      code: "CS",
      color: "bg-teal-500",
      description: "Customer service and support"
    },
    {
      value: "IS",
      label: "Information Systems",
      code: "IS",
      color: "bg-cyan-500",
      description: "IT and information systems management"
    },
    {
      value: "SALES",
      label: "Sales",
      code: "SALES",
      color: "bg-cyan-500",
      description: "Sales and business development"
    },
    {
      value: "LVM-EXPAT",
      label: "LVM EXPATS",
      code: "LVM-EXPAT",
      color: "bg-gray-500",
      description: "LVM Expatriate team"
    }
  ] as const,

  // User Roles Configuration - Updated with comprehensive hierarchy
  roles: {
    // System Administrator (Level 11) - Full system access
    ADMIN: {
      value: "ADMIN",
      label: "System Administrator",
      description: "Full system administrator with complete access",
      level: 11,
      permissions: ["*"] as Permission[]
    },
    // Executive Level (Level 10-9)
    GENERAL_DIRECTOR: {
      value: "GENERAL DIRECTOR",
      label: "General Director",
      description: "Top executive with full system access",
      level: 10,
      permissions: ["*"] as Permission[]
    },
    GENERAL_MANAGER: {
      value: "GENERAL MANAGER",
      label: "General Manager",
      description: "Senior executive with broad management access",
      level: 9,
      permissions: ["*"] as Permission[]
    },
    ASSISTANT_GENERAL_MANAGER: {
      value: "ASSISTANT GENERAL MANAGER",
      label: "Assistant General Manager",
      description: "Assistant to general manager with high-level access",
      level: 8,
      permissions: [
        "projects:read", "projects:write", "projects:delete",
        "tasks:read", "tasks:write", "tasks:delete",
        "team:read", "team:write", "reports:read", "analytics:read",
        "userManagement", "systemSettings",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:delete", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports", "helpdesk:admin"
      ] as Permission[]
    },
    ASSISTANT_GENERAL_MANAGER_2: {
      value: "ASSISTANT GENERAL MANAGER 2",
      label: "Assistant General Manager 2",
      description: "Second assistant general manager",
      level: 8,
      permissions: [
        "projects:read", "projects:write", "projects:delete",
        "tasks:read", "tasks:write", "tasks:delete",
        "team:read", "team:write", "reports:read", "analytics:read",
        "userManagement", "systemSettings",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:delete", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports", "helpdesk:admin"
      ] as Permission[]
    },

    // Senior Management Level (Level 7-6)
    SENIOR_MANAGER: {
      value: "SENIOR MANAGER",
      label: "Senior Manager",
      description: "Senior management with broad access",
      level: 7,
      permissions: [
        "projects:read", "projects:write", "projects:delete",
        "tasks:read", "tasks:write", "tasks:delete",
        "team:read", "team:write", "reports:read", "analytics:read",
        "userManagement",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:delete", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports", "helpdesk:admin"
      ] as Permission[]
    },
    SENIOR_MANAGER_2: {
      value: "SENIOR MANAGER 2",
      label: "Senior Manager 2",
      description: "Second senior manager level",
      level: 7,
      permissions: [
        "projects:read", "projects:write", "projects:delete",
        "tasks:read", "tasks:write", "tasks:delete",
        "team:read", "team:write", "reports:read", "analytics:read",
        "userManagement",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:delete", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports", "helpdesk:admin"
      ] as Permission[]
    },
    ASSISTANT_SENIOR_MANAGER: {
      value: "ASSISTANT SENIOR MANAGER",
      label: "Assistant Senior Manager",
      description: "Assistant to senior manager",
      level: 6,
      permissions: [
        "projects:read", "projects:write",
        "tasks:read", "tasks:write", "tasks:delete",
        "team:read", "reports:read", "analytics:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports"
      ] as Permission[]
    },

    // Management Level (Level 5-4)
    MANAGER: {
      value: "MANAGER",
      label: "Manager",
      description: "Department or team manager",
      level: 5,
      permissions: [
        "projects:read", "projects:write",
        "tasks:read", "tasks:write",
        "team:read", "reports:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports"
      ] as Permission[]
    },
    MANAGER_2: {
      value: "MANAGER 2",
      label: "Manager 2",
      description: "Second manager level",
      level: 5,
      permissions: [
        "projects:read", "projects:write",
        "tasks:read", "tasks:write",
        "team:read", "reports:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports"
      ] as Permission[]
    },
    ASSISTANT_MANAGER: {
      value: "ASSISTANT MANAGER",
      label: "Assistant Manager",
      description: "Assistant to manager",
      level: 4,
      permissions: [
        "projects:read", "projects:write",
        "tasks:read", "tasks:write",
        "team:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    ASSISTANT_MANAGER_2: {
      value: "ASSISTANT MANAGER 2",
      label: "Assistant Manager 2",
      description: "Second assistant manager level",
      level: 4,
      permissions: [
        "projects:read", "projects:write",
        "tasks:read", "tasks:write",
        "team:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },

    // Supervision Level (Level 3)
    SUPERVISOR: {
      value: "SUPERVISOR",
      label: "Supervisor",
      description: "Team supervisor with limited management access",
      level: 3,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "team:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    SUPERVISOR_2: {
      value: "SUPERVISOR 2",
      label: "Supervisor 2",
      description: "Second supervisor level",
      level: 3,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "team:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    LINE_LEADER: {
      value: "LINE LEADER",
      label: "Line Leader",
      description: "Production line leader",
      level: 3,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:resolve"
      ] as Permission[]
    },

    // Specialist Level (Level 2)
    CHIEF_SPECIALIST: {
      value: "CHIEF SPECIALIST",
      label: "Chief Specialist",
      description: "Chief specialist with technical expertise",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "analytics:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    TECHNICAL_SPECIALIST: {
      value: "TECHNICAL SPECIALIST",
      label: "Technical Specialist",
      description: "Technical specialist with advanced skills",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    SENIOR_SPECIALIST: {
      value: "SENIOR SPECIALIST",
      label: "Senior Specialist",
      description: "Senior specialist with experience",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    SENIOR_SPECIALIST_2: {
      value: "SENIOR SPECIALIST 2",
      label: "Senior Specialist 2",
      description: "Second senior specialist level",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    SPECIALIST: {
      value: "SPECIALIST",
      label: "Specialist",
      description: "Specialist with specific expertise",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    SPECIALIST_2: {
      value: "SPECIALIST 2",
      label: "Specialist 2",
      description: "Second specialist level",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },

    // Engineering Level (Level 2)
    SENIOR_ENGINEER: {
      value: "SENIOR ENGINEER",
      label: "Senior Engineer",
      description: "Senior engineer with technical leadership",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "analytics:read",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    ENGINEER: {
      value: "ENGINEER",
      label: "Engineer",
      description: "Engineer with technical skills",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:assign", "helpdesk:resolve"
      ] as Permission[]
    },
    TECHNICIAN: {
      value: "TECHNICIAN",
      label: "Technician",
      description: "Technical support and maintenance",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:resolve"
      ] as Permission[]
    },

    // Staff Level (Level 1)
    SENIOR_ASSOCIATE: {
      value: "SENIOR ASSOCIATE",
      label: "Senior Associate",
      description: "Senior associate with experience",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update"
      ] as Permission[]
    },
    ASSOCIATE: {
      value: "ASSOCIATE",
      label: "Associate",
      description: "Associate level staff",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update"
      ] as Permission[]
    },
    SENIOR_STAFF: {
      value: "SENIOR STAFF",
      label: "Senior Staff",
      description: "Senior staff member",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update"
      ] as Permission[]
    },
    STAFF: {
      value: "STAFF",
      label: "Staff",
      description: "Regular staff member",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create", "helpdesk:update"
      ] as Permission[]
    },

    // Operations Level (Level 0)
    SENIOR_OPERATOR: {
      value: "SENIOR OPERATOR",
      label: "Senior Operator",
      description: "Senior operator with experience",
      level: 0,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write",
        "helpdesk:read", "helpdesk:create"
      ] as Permission[]
    },
    OPERATOR: {
      value: "OPERATOR",
      label: "Operator",
      description: "System operator",
      level: 0,
      permissions: [
        "projects:read",
        "tasks:read",
        "helpdesk:read"
      ] as Permission[]
    },
    INTERN: {
      value: "INTERN",
      label: "Intern",
      description: "Intern or temporary staff",
      level: 0,
      permissions: [
        "projects:read",
        "tasks:read",
        "helpdesk:read"
      ] as Permission[]
    }
  } as const,

  // RBAC (Role-Based Access Control) Configuration
  rbac: {
    // Feature access control
    features: {
      projectManagement: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER"
        ] as RoleName[],
        description: "Project creation and management"
      },
      taskManagement: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR"
        ] as RoleName[],
        description: "Task creation and management"
      },
      helpdeskManagement: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2"
        ] as RoleName[],
        description: "Full helpdesk management access"
      },
      helpdeskAgent: {
        roles: [
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN"
        ] as RoleName[],
        description: "Helpdesk agent access"
      },
      helpdeskViewer: {
        roles: [
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        description: "View-only helpdesk access"
      },
      teamManagement: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF"
        ] as RoleName[],
        description: "Team member management and KPIs (read-only for team members, full access for managers+)"
      },
      analytics: {
        roles: [
          "ADMIN", "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "CHIEF_SPECIALIST", "SENIOR_ENGINEER"
        ] as RoleName[],
        description: "Analytics and reporting"
      },
      userManagement: {
        roles: [
          "ADMIN", "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[],
        description: "User account management"
      },
      systemSettings: {
        roles: [
          "ADMIN", "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2"
        ] as RoleName[],
        description: "System configuration and settings"
      },
      announcements: {
        roles: [
          "ADMIN", "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER"
        ] as RoleName[],
        description: "Create and send announcements to all users"
      }
    },

    // Page access control
    pages: {
      dashboard: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        description: "Main dashboard"
      },
      projects: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        description: "Projects page"
      },
      tasks: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        description: "Tasks page"
      },
      helpdesk: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        description: "Helpdesk main page"
      },
      team: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF"
        ] as RoleName[],
        description: "Team management page (read-only for team members, full access for managers+)"
      },
      admin: {
        roles: [
          "ADMIN", "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[],
        description: "Admin panel"
      }
    },

    // API endpoint access control
    api: {
      projects: {
        GET: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        POST: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2"
        ] as RoleName[],
        PUT: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2"
        ] as RoleName[],
        DELETE: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[]
      },
      tasks: {
        GET: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        POST: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR"
        ] as RoleName[],
        PUT: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR"
        ] as RoleName[],
        DELETE: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2"
        ] as RoleName[]
      },
      tickets: {
        GET: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN",
          "SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF", "SENIOR_OPERATOR", "OPERATOR", "INTERN"
        ] as RoleName[],
        POST: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN"
        ] as RoleName[],
        PUT: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
          "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
          "CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2",
          "SPECIALIST", "SPECIALIST_2", "SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN"
        ] as RoleName[],
        DELETE: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2"
        ] as RoleName[]
      },
      users: {
        GET: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "MANAGER", "MANAGER_2"
        ] as RoleName[],
        POST: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[],
        PUT: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[],
        DELETE: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER"
        ] as RoleName[]
      },
      team: {
        GET: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "MANAGER", "MANAGER_2"
        ] as RoleName[],
        POST: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[],
        PUT: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2"
        ] as RoleName[],
        DELETE: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER"
        ] as RoleName[]
      }
    }
  },

  // Task Configuration
  tasks: {
    priorities: [
      { value: "LOW", label: "Low", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800 border-orange-200" },
      { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800 border-red-200" }
    ] as const,
    statuses: [
      { value: "TODO", label: "To Do", color: "bg-gray-100 text-gray-800 border-gray-200" },
      { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
      { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "BLOCKED", label: "Blocked", color: "bg-red-100 text-red-800 border-red-200" }
    ] as const
  },

  // Project Configuration
  projects: {
    statuses: [
      { value: "PLANNING", label: "Planning", color: "bg-gray-100 text-gray-800 border-gray-200" },
      { value: "ACTIVE", label: "Active", color: "bg-blue-100 text-blue-800 border-blue-200" },
      { value: "ON_HOLD", label: "On Hold", color: "bg-orange-100 text-orange-800 border-orange-200" },
      { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" }
    ] as const,
    approvalStates: [
      { value: "PENDING", label: "Pending", color: "bg-orange-100 text-orange-800 border-orange-200" },
      { value: "APPROVED", label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" }
    ] as const
  },

  // UI Configuration
  ui: {
    // Pagination settings
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50, 100]
    },

    // Table settings
    table: {
      defaultSortField: "createdAt",
      defaultSortOrder: "desc",
      rowHeight: "h-16",
      hoverEffect: true
    },

    // Form settings
    form: {
      defaultValidation: true,
      showHelpText: true,
      autoSave: false
    },

    // Notification settings
    notifications: {
      position: "top-right",
      duration: 5000,
      maxNotifications: 5
    },

    // Theme settings
    theme: {
      primaryColor: "blue",
      secondaryColor: "gray",
      borderRadius: "rounded-lg",
      shadow: "shadow-sm"
    }
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Database Configuration
  database: {
    // Prisma configuration
    prisma: {
      logQueries: process.env.NODE_ENV === "development",
      logErrors: true
    }
  },

  // Security Configuration
  security: {
    // Password requirements
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },

    // Session configuration
    session: {
      maxAge: 24 * 60 * 60, // 24 hours
      updateAge: 60 * 60, // 1 hour
      secure: process.env.NODE_ENV === "production"
    },

    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    uploadPath: "/uploads"
  },

  // Helpdesk Configuration
  helpdesk: {
    // Permission Matrix for Helpdesk Operations
    permissionMatrix: {
      // System Administrator Level (Level 11) - Complete Access
      ADMIN: {
        roles: ["ADMIN"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          assign: true,
          resolve: true,
          escalate: true,
          reports: true,
          admin: true,
          departmentScope: "all"
        }
      },
      // Executive Level (Level 10-9) - Full Access
      EXECUTIVE: {
        roles: ["GENERAL_DIRECTOR", "GENERAL_MANAGER"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          assign: true,
          resolve: true,
          escalate: true,
          reports: true,
          admin: true,
          departmentScope: "all"
        }
      },
      // Senior Management Level (Level 8-7) - Full Management Access
      SENIOR_MANAGEMENT: {
        roles: ["ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2", "SENIOR_MANAGER", "SENIOR_MANAGER_2"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          assign: true,
          resolve: true,
          escalate: true,
          reports: true,
          admin: true,
          departmentScope: "all"
        }
      },
      // Management Level (Level 6-5) - Department Management
      MANAGEMENT: {
        roles: ["ASSISTANT_SENIOR_MANAGER", "MANAGER", "MANAGER_2"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: false,
          assign: true,
          resolve: true,
          escalate: true,
          reports: true,
          admin: false,
          departmentScope: "own"
        }
      },
      // Assistant Management Level (Level 4) - Limited Management
      ASSISTANT_MANAGEMENT: {
        roles: ["ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: false,
          assign: true,
          resolve: true,
          escalate: false,
          reports: false,
          admin: false,
          departmentScope: "own"
        }
      },
      // Supervision Level (Level 3) - Team Supervision
      SUPERVISION: {
        roles: ["SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: false,
          assign: true,
          resolve: true,
          escalate: false,
          reports: false,
          admin: false,
          departmentScope: "own"
        }
      },
      // Specialist Level (Level 2) - Technical Expertise
      SPECIALIST: {
        roles: ["CHIEF_SPECIALIST", "TECHNICAL_SPECIALIST", "SENIOR_SPECIALIST", "SENIOR_SPECIALIST_2", "SPECIALIST", "SPECIALIST_2"],
        permissions: {
          read: true,
          create: true,
          update: false,
          delete: false,
          assign: true,
          resolve: false,
          escalate: false,
          reports: false,
          admin: false,
          departmentScope: "all"
        }
      },
      // Engineering Level (Level 2) - Technical Support
      ENGINEERING: {
        roles: ["SENIOR_ENGINEER", "ENGINEER", "TECHNICIAN"],
        permissions: {
          read: true,
          create: true,
          update: false,
          delete: false,
          assign: true,
          resolve: false,
          escalate: false,
          reports: false,
          admin: false,
          departmentScope: "all"
        }
      },
      // Staff Level (Level 1) - Basic Operations
      STAFF: {
        roles: ["SENIOR_ASSOCIATE", "ASSOCIATE", "SENIOR_STAFF", "STAFF"],
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: false,
          assign: false,
          resolve: false,
          escalate: false,
          reports: false,
          admin: false,
          departmentScope: "own"
        }
      },
      // Operations Level (Level 0) - Limited Access
      OPERATIONS: {
        roles: ["SENIOR_OPERATOR", "OPERATOR", "INTERN"],
        permissions: {
          read: true,
          create: false,
          update: false,
          delete: false,
          assign: false,
          resolve: false,
          escalate: false,
          reports: false,
          admin: false,
          departmentScope: "own"
        }
      }
    },
    categories: [
      {
        value: "SUPPORT",
        label: "Support",
        icon: "User", // Corresponds to LucideReact icon name
        description: "General support requests",
        color: "bg-blue-100 text-blue-800 border-blue-200"
      },
      {
        value: "BUG",
        label: "Bug Report",
        icon: "AlertCircle",
        description: "Software bugs and issues",
        color: "bg-red-100 text-red-800 border-red-200"
      },
      {
        value: "FEATURE_REQUEST",
        label: "Feature Request",
        icon: "Plus",
        description: "New feature requests",
        color: "bg-green-100 text-green-800 border-green-200"
      },
      {
        value: "TECHNICAL_ISSUE",
        label: "Technical Issue",
        icon: "Wrench",
        description: "Technical problems and issues",
        color: "bg-orange-100 text-orange-800 border-orange-200"
      },
      {
        value: "GENERAL",
        label: "General",
        icon: "FileText",
        description: "General inquiries and requests",
        color: "bg-gray-100 text-gray-800 border-gray-200"
      }
    ],
    priorities: [
      {
        value: "LOW",
        label: "Low",
        color: "bg-green-100 text-green-800 border-green-200",
        description: "Non-urgent issues"
      },
      {
        value: "MEDIUM",
        label: "Medium",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        description: "Standard priority issues"
      },
      {
        value: "HIGH",
        label: "High",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        description: "Important issues requiring attention"
      },
      {
        value: "URGENT",
        label: "Urgent",
        color: "bg-red-100 text-red-800 border-red-200",
        description: "Critical issues requiring immediate attention"
      }
    ],
    statuses: [
      {
        value: "OPEN",
        label: "Open",
        icon: "AlertCircle",
        color: "text-orange-500",
        description: "New ticket awaiting assignment"
      },
      {
        value: "IN_PROGRESS",
        label: "In Progress",
        icon: "Clock",
        color: "text-blue-500",
        description: "Ticket is being worked on"
      },
      {
        value: "PENDING",
        label: "Pending",
        icon: "Clock",
        color: "text-yellow-500",
        description: "Waiting for customer response or external action"
      },
      {
        value: "RESOLVED",
        label: "Resolved",
        icon: "CheckCircle",
        color: "text-green-500",
        description: "Issue resolved, awaiting customer confirmation"
      },
      {
        value: "CLOSED",
        label: "Closed",
        icon: "XCircle",
        color: "text-gray-500",
        description: "Ticket closed and completed"
      }
    ]
  },


} as const;

// Type definitions for the config
export type Department = typeof APP_CONFIG.departments[number];
export type Role = keyof typeof APP_CONFIG.roles;
export type TaskPriority = typeof APP_CONFIG.tasks.priorities[number]["value"];
export type TaskStatus = typeof APP_CONFIG.tasks.statuses[number]["value"];
export type ProjectStatus = typeof APP_CONFIG.projects.statuses[number]["value"];
export type ApprovalState = typeof APP_CONFIG.projects.approvalStates[number]["value"];
export type TicketCategory = typeof APP_CONFIG.helpdesk.categories[number]["value"];
export type TicketPriority = typeof APP_CONFIG.helpdesk.priorities[number]["value"];
export type TicketStatus = typeof APP_CONFIG.helpdesk.statuses[number]["value"];



// Helper functions
export const getDepartmentByValue = (value: string) => {
  return APP_CONFIG.departments.find(dept => dept.value === value);
};

export const getRoleByValue = (value: string) => {
  return APP_CONFIG.roles[value as Role];
};

// Map database role values to config keys
export const mapRoleToConfigKey = (roleValue: string): Role => {
  // Map common database role values to config keys
  const roleMapping: Record<string, Role> = {
    // Admin Level
    "ADMIN": "GENERAL_DIRECTOR", // Map ADMIN to GENERAL_DIRECTOR for full access
    
    // Executive Level
    "GENERAL DIRECTOR": "GENERAL_DIRECTOR",
    "GENERAL MANAGER": "GENERAL_MANAGER",
    "ASSISTANT GENERAL MANAGER": "ASSISTANT_GENERAL_MANAGER",
    "ASSISTANT GENERAL MANAGER 2": "ASSISTANT_GENERAL_MANAGER_2",
    
    // Senior Management Level
    "SENIOR MANAGER": "SENIOR_MANAGER",
    "SENIOR MANAGER 2": "SENIOR_MANAGER_2",
    "ASSISTANT SENIOR MANAGER": "ASSISTANT_SENIOR_MANAGER",
    
    // Management Level
    "MANAGER": "MANAGER",
    "MANAGER 2": "MANAGER_2",
    "ASSISTANT MANAGER": "ASSISTANT_MANAGER",
    "ASSISTANT MANAGER 2": "ASSISTANT_MANAGER_2",
    
    // Supervision Level
    "SUPERVISOR": "SUPERVISOR",
    "SUPERVISOR 2": "SUPERVISOR_2",
    "LINE LEADER": "LINE_LEADER",
    
    // Specialist Level
    "CHIEF SPECIALIST": "CHIEF_SPECIALIST",
    "TECHNICAL SPECIALIST": "TECHNICAL_SPECIALIST",
    "SENIOR SPECIALIST": "SENIOR_SPECIALIST",
    "SENIOR SPECIALIST 2": "SENIOR_SPECIALIST_2",
    "SPECIALIST": "SPECIALIST",
    "SPECIALIST 2": "SPECIALIST_2",
    
    // Engineering Level
    "SENIOR ENGINEER": "SENIOR_ENGINEER",
    "ENGINEER": "ENGINEER",
    "TECHNICIAN": "TECHNICIAN",
    
    // Staff Level
    "SENIOR ASSOCIATE": "SENIOR_ASSOCIATE",
    "ASSOCIATE": "ASSOCIATE",
    "SENIOR STAFF": "SENIOR_STAFF",
    "STAFF": "STAFF",
    
    // Operations Level
    "SENIOR OPERATOR": "SENIOR_OPERATOR",
    "OPERATOR": "OPERATOR",
    "INTERN": "INTERN"
  };
  
  return roleMapping[roleValue] || "STAFF"; // Default to STAFF if unknown
};

export const hasPermission = (userRole: Role, permission: string) => {
  const role = APP_CONFIG.roles[userRole];
  return role.permissions.includes("*") || role.permissions.includes(permission);
};

export const canAccessFeature = (userRole: Role, feature: keyof typeof APP_CONFIG.rbac.features) => {
  const featureConfig = APP_CONFIG.rbac.features[feature];
  return featureConfig.roles.includes(userRole as RoleName);
};

export const canAccessPage = (userRole: string, page: keyof typeof APP_CONFIG.rbac.pages) => {
  const mappedRole = mapRoleToConfigKey(userRole);
  const pageConfig = APP_CONFIG.rbac.pages[page];
  return pageConfig.roles.includes(mappedRole as RoleName);
};

export const canAccessApi = (userRole: Role, endpoint: keyof typeof APP_CONFIG.rbac.api, method: string) => {
  const apiConfig = APP_CONFIG.rbac.api[endpoint];
  return apiConfig[method as keyof typeof apiConfig]?.includes(userRole as RoleName) || false;
};

export const getRolesByLevel = (minLevel: number) => {
  return Object.entries(APP_CONFIG.roles)
    .filter(([_, role]) => role.level >= minLevel)
    .map(([key, role]) => ({ key, ...role }));
};

export const getDepartments = () => APP_CONFIG.departments;

// Department Code Mapping Functions
export const getDepartmentCodes = () => APP_CONFIG.departmentCodes;

export const getDepartmentNameByCode = (code: string): string | undefined => {
  return APP_CONFIG.departmentCodes[code as keyof typeof APP_CONFIG.departmentCodes];
};

export const getDepartmentCodeByName = (name: string): string | undefined => {
  const codes = Object.keys(APP_CONFIG.departmentCodes);
  return codes.find(code => 
    APP_CONFIG.departmentCodes[code as keyof typeof APP_CONFIG.departmentCodes] === name
  );
};

export const getDepartmentByCode = (code: string) => {
  return APP_CONFIG.departments.find(dept => dept.code === code);
};

export const mapUserDepartmentToCode = (userDepartment: string): string => {
  // First try exact match
  if (APP_CONFIG.departmentCodes[userDepartment as keyof typeof APP_CONFIG.departmentCodes]) {
    return userDepartment;
  }
  
  // Try case-insensitive match
  const upperDepartment = userDepartment.toUpperCase();
  if (APP_CONFIG.departmentCodes[upperDepartment as keyof typeof APP_CONFIG.departmentCodes]) {
    return upperDepartment;
  }
  
  // Try partial match by name
  const codes = Object.keys(APP_CONFIG.departmentCodes);
  const matchedCode = codes.find(code => {
    const deptName = APP_CONFIG.departmentCodes[code as keyof typeof APP_CONFIG.departmentCodes];
    return deptName.toLowerCase().includes(userDepartment.toLowerCase()) ||
           userDepartment.toLowerCase().includes(deptName.toLowerCase());
  });
  
  return matchedCode || userDepartment; // Return original if no match found
};

// Department Home Page Functions
export const getDepartmentHomePage = (departmentCode: string): string => {
  const normalizedCode = departmentCode?.toUpperCase().trim();
  return APP_CONFIG.departmentHomePages[normalizedCode as keyof typeof APP_CONFIG.departmentHomePages] || APP_CONFIG.departmentHomePages.DEFAULT;
};

export const getUserHomePage = (userDepartment: string): string => {
  const mappedDepartment = mapUserDepartmentToCode(userDepartment);
  return getDepartmentHomePage(mappedDepartment);
};
export const getRoles = () => APP_CONFIG.roles;
export const getTaskPriorities = () => APP_CONFIG.tasks.priorities;
export const getTaskStatuses = () => APP_CONFIG.tasks.statuses;
export const getProjectStatuses = () => APP_CONFIG.projects.statuses;
export const getApprovalStates = () => APP_CONFIG.projects.approvalStates;
export const getTicketCategories = () => APP_CONFIG.helpdesk.categories;
export const getTicketPriorities = () => APP_CONFIG.helpdesk.priorities;
export const getTicketStatuses = () => APP_CONFIG.helpdesk.statuses; 



// Helpdesk Permission Matrix Helper Functions
export const getHelpdeskPermissionMatrix = () => APP_CONFIG.helpdesk.permissionMatrix;

export const getHelpdeskPermissionsForRole = (userRole: string) => {
  const matrix = APP_CONFIG.helpdesk.permissionMatrix;
  
  for (const [level, config] of Object.entries(matrix)) {
    if ((config.roles as readonly string[]).includes(userRole)) {
      return config.permissions;
    }
  }
  
  // Default to OPERATIONS level if role not found
  return matrix.OPERATIONS.permissions;
};

export const canUserPerformHelpdeskAction = (userRole: string, action: keyof typeof APP_CONFIG.helpdesk.permissionMatrix.EXECUTIVE.permissions) => {
  const permissions = getHelpdeskPermissionsForRole(userRole);
  return permissions[action] || false;
};

export const getHelpdeskDepartmentScope = (userRole: string) => {
  const permissions = getHelpdeskPermissionsForRole(userRole);
  return permissions.departmentScope;
};

export const getHelpdeskPermissionLevel = (userRole: string) => {
  const matrix = APP_CONFIG.helpdesk.permissionMatrix;
  
  for (const [level, config] of Object.entries(matrix)) {
    if ((config.roles as readonly string[]).includes(userRole)) {
      return level;
    }
  }
  
  return 'OPERATIONS';
}; 