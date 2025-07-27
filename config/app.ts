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

  // Departments Configuration
  departments: [
    {
      value: "logistics",
      label: "Logistics",
      color: "bg-blue-500",
      description: "Supply chain and logistics management"
    },
    {
      value: "procurement",
      label: "Procurement",
      color: "bg-green-500",
      description: "Purchasing and procurement operations"
    },
    {
      value: "pc",
      label: "Production Planning",
      color: "bg-purple-500",
      description: "Production planning and scheduling"
    },
    {
      value: "qa",
      label: "Quality Assurance",
      color: "bg-yellow-500",
      description: "Quality assurance and testing"
    },
    {
      value: "qc",
      label: "Quality Control",
      color: "bg-orange-500",
      description: "Quality control and inspection"
    },
    {
      value: "pm",
      label: "Production Maintenance",
      color: "bg-red-500",
      description: "Production equipment maintenance"
    },
    {
      value: "fm",
      label: "Facility Management",
      color: "bg-indigo-500",
      description: "Facility and infrastructure management"
    },
    {
      value: "hra",
      label: "Human Resources",
      color: "bg-pink-500",
      description: "Human resources and personnel management"
    },
    {
      value: "cs",
      label: "Customer Service",
      color: "bg-teal-500",
      description: "Customer service and support"
    },
    {
      value: "sales",
      label: "Sales",
      color: "bg-cyan-500",
      description: "Sales and business development"
    },
    {
      value: "LVM-EXPAT",
      label: "LVM EXPATS",
      color: "bg-gray-500",
      description: "LVM Expatriate team"
    }
  ] as const,

  // User Roles Configuration - Updated with comprehensive hierarchy
  roles: {
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
        "userManagement", "systemSettings"
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
        "userManagement", "systemSettings"
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
        "userManagement"
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
        "userManagement"
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
        "team:read", "reports:read", "analytics:read"
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
        "team:read", "reports:read"
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
        "team:read", "reports:read"
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
        "team:read"
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
        "team:read"
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
        "team:read"
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
        "team:read"
      ] as Permission[]
    },
    LINE_LEADER: {
      value: "LINE LEADER",
      label: "Line Leader",
      description: "Production line leader",
      level: 3,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
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
        "analytics:read"
      ] as Permission[]
    },
    TECHNICAL_SPECIALIST: {
      value: "TECHNICAL SPECIALIST",
      label: "Technical Specialist",
      description: "Technical specialist with advanced skills",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    SENIOR_SPECIALIST: {
      value: "SENIOR SPECIALIST",
      label: "Senior Specialist",
      description: "Senior specialist with experience",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    SENIOR_SPECIALIST_2: {
      value: "SENIOR SPECIALIST 2",
      label: "Senior Specialist 2",
      description: "Second senior specialist level",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    SPECIALIST: {
      value: "SPECIALIST",
      label: "Specialist",
      description: "Specialist with specific expertise",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    SPECIALIST_2: {
      value: "SPECIALIST 2",
      label: "Specialist 2",
      description: "Second specialist level",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
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
        "analytics:read"
      ] as Permission[]
    },
    ENGINEER: {
      value: "ENGINEER",
      label: "Engineer",
      description: "Engineer with technical skills",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    TECHNICIAN: {
      value: "TECHNICIAN",
      label: "Technician",
      description: "Technical support and maintenance",
      level: 2,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
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
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    ASSOCIATE: {
      value: "ASSOCIATE",
      label: "Associate",
      description: "Associate level staff",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    SENIOR_STAFF: {
      value: "SENIOR STAFF",
      label: "Senior Staff",
      description: "Senior staff member",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    STAFF: {
      value: "STAFF",
      label: "Staff",
      description: "Regular staff member",
      level: 1,
      permissions: [
        "projects:read",
        "tasks:read", "tasks:write"
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
        "tasks:read", "tasks:write"
      ] as Permission[]
    },
    OPERATOR: {
      value: "OPERATOR",
      label: "Operator",
      description: "System operator",
      level: 0,
      permissions: [
        "projects:read",
        "tasks:read"
      ] as Permission[]
    },
    INTERN: {
      value: "INTERN",
      label: "Intern",
      description: "Intern or temporary staff",
      level: 0,
      permissions: [
        "projects:read",
        "tasks:read"
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
      teamManagement: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2"
        ] as RoleName[],
        description: "Team member management and KPIs"
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
      team: {
        roles: [
          "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
          "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
          "MANAGER", "MANAGER_2"
        ] as RoleName[],
        description: "Team management page"
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
  }
} as const;

// Type definitions for the config
export type Department = typeof APP_CONFIG.departments[number];
export type Role = keyof typeof APP_CONFIG.roles;
export type TaskPriority = typeof APP_CONFIG.tasks.priorities[number]["value"];
export type TaskStatus = typeof APP_CONFIG.tasks.statuses[number]["value"];
export type ProjectStatus = typeof APP_CONFIG.projects.statuses[number]["value"];
export type ApprovalState = typeof APP_CONFIG.projects.approvalStates[number]["value"];

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
export const getRoles = () => APP_CONFIG.roles;
export const getTaskPriorities = () => APP_CONFIG.tasks.priorities;
export const getTaskStatuses = () => APP_CONFIG.tasks.statuses;
export const getProjectStatuses = () => APP_CONFIG.projects.statuses;
export const getApprovalStates = () => APP_CONFIG.projects.approvalStates; 