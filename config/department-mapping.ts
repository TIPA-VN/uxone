/**
 * Comprehensive Department Mapping Configuration
 * Maps legacy system department names to UXOne department codes
 */

export interface DepartmentMapping {
  legacyName: string;
  uxoneCode: string;
  category: 'core' | 'production' | 'support' | 'manufacturing';
  description: string;
  isActive: boolean;
  homePage?: string;
  aliases?: string[];
}

export const DEPARTMENT_MAPPING: DepartmentMapping[] = [
  // Core Business Departments (Existing UXOne pages)
  {
    legacyName: "Information Systems",
    uxoneCode: "IS",
    category: "core",
    description: "IT and information systems management",
    isActive: true,
    homePage: "/lvm/helpdesk",
    aliases: ["IS", "IT", "Information Technology"]
  },
  {
    legacyName: "Logistics",
    uxoneCode: "LOG",
    category: "core",
    description: "Supply chain and logistics management",
    isActive: true,
    homePage: "/lvm/logistics",
    aliases: ["LOG", "Logistic"]
  },
  {
    legacyName: "Procurement",
    uxoneCode: "PROC",
    category: "core",
    description: "Purchasing and procurement operations",
    isActive: true,
    homePage: "/lvm/procurement",
    aliases: ["PROC"]
  },
  {
    legacyName: "Production Planning",
    uxoneCode: "PC",
    category: "core",
    description: "Production planning and scheduling",
    isActive: true,
    homePage: "/lvm/pc",
    aliases: ["PC", "Production Control"]
  },
  {
    legacyName: "Quality Assurance",
    uxoneCode: "QA",
    category: "core",
    description: "Quality assurance and testing",
    isActive: true,
    homePage: "/lvm/quality-assurance",
    aliases: ["QA"]
  },
  {
    legacyName: "Quality Control",
    uxoneCode: "QC",
    category: "core",
    description: "Quality control and inspection",
    isActive: true,
    homePage: "/lvm/quality-control",
    aliases: ["QC"]
  },
  {
    legacyName: "Production Maintenance",
    uxoneCode: "PM",
    category: "core",
    description: "Production equipment maintenance",
    isActive: true,
    homePage: "/lvm/production-maintenance",
    aliases: ["PM"]
  },
  {
    legacyName: "Facility Management",
    uxoneCode: "FM",
    category: "core",
    description: "Facility and infrastructure management",
    isActive: true,
    homePage: "/lvm/facility-management",
    aliases: ["FM"]
  },
  {
    legacyName: "Human Resources",
    uxoneCode: "HR",
    category: "core",
    description: "Human resources and personnel management",
    isActive: true,
    homePage: "/lvm/human-resources",
    aliases: ["HR", "HRA"]
  },
  {
    legacyName: "Customer Service",
    uxoneCode: "CS",
    category: "core",
    description: "Customer service and support",
    isActive: true,
    homePage: "/lvm/customer-service",
    aliases: ["CS"]
  },
  {
    legacyName: "Sales",
    uxoneCode: "SALES",
    category: "core",
    description: "Sales and business development",
    isActive: true,
    homePage: "/lvm/sales",
    aliases: ["SALES"]
  },
  {
    legacyName: "LVM EXPATS",
    uxoneCode: "LVM-EXPAT",
    category: "core",
    description: "LVM Expatriate team",
    isActive: true,
    homePage: "/lvm",
    aliases: ["LVM-EXPAT"]
  },

  // Production & Manufacturing Departments (New mapping needed)
  {
    legacyName: "Manufacturing",
    uxoneCode: "MFG",
    category: "manufacturing",
    description: "General manufacturing operations",
    isActive: true,
    homePage: "/lvm/production",
    aliases: ["MFG"]
  },
  {
    legacyName: "Manufacturing Engineering",
    uxoneCode: "ME",
    category: "manufacturing",
    description: "Manufacturing engineering and process design",
    isActive: true,
    homePage: "/lvm/production/engineering",
    aliases: ["ME", "MFG-ENG"]
  },
  {
    legacyName: "Product Engineering",
    uxoneCode: "DES",
    category: "manufacturing",
    description: "Product engineering and design",
    isActive: true,
    homePage: "/lvm/production/engineering",
    aliases: ["DES", "PROD-ENG"]
  },
  {
    legacyName: "Motor Assembly",
    uxoneCode: "MOTOR-ASSY",
    category: "production",
    description: "Motor assembly operations",
    isActive: true,
    homePage: "/lvm/production/assembly",
    aliases: ["MOTOR-ASSY"]
  },
  {
    legacyName: "Motor Painting",
    uxoneCode: "MOTOR-PAINT",
    category: "production",
    description: "Motor painting and finishing",
    isActive: true,
    homePage: "/lvm/production/painting",
    aliases: ["MOTOR-PAINT"]
  },
  {
    legacyName: "RoterStator Assembly",
    uxoneCode: "ROTOR-STATOR",
    category: "production",
    description: "Rotor and stator assembly",
    isActive: true,
    homePage: "/lvm/production/assembly",
    aliases: ["ROTOR-STATOR"]
  },
  {
    legacyName: "Winding",
    uxoneCode: "WINDING",
    category: "production",
    description: "Motor winding operations",
    isActive: true,
    homePage: "/lvm/production/winding",
    aliases: ["WINDING"]
  },
  {
    legacyName: "Lamination Punching",
    uxoneCode: "LAM-PUNCH",
    category: "production",
    description: "Lamination punching operations",
    isActive: true,
    homePage: "/lvm/production/machining",
    aliases: ["LAM-PUNCH"]
  },
  {
    legacyName: "Bracket Machining",
    uxoneCode: "BRACKET-MACH",
    category: "production",
    description: "Bracket machining operations",
    isActive: true,
    homePage: "/lvm/production/machining",
    aliases: ["BRACKET-MACH"]
  },
  {
    legacyName: "Frame Machining",
    uxoneCode: "FRAME-MACH",
    category: "production",
    description: "Frame machining operations",
    isActive: true,
    homePage: "/lvm/production/machining",
    aliases: ["FRAME-MACH"]
  },
  {
    legacyName: "Rotor Die Casting",
    uxoneCode: "ROTOR-DIE",
    category: "production",
    description: "Rotor die casting operations",
    isActive: true,
    homePage: "/lvm/production/casting",
    aliases: ["ROTOR-DIE"]
  },
  {
    legacyName: "Shaft Machining",
    uxoneCode: "SHAFT-MACH",
    category: "production",
    description: "Shaft machining operations",
    isActive: true,
    homePage: "/lvm/production/machining",
    aliases: ["SHAFT-MACH"]
  },
  {
    legacyName: "Vanish",
    uxoneCode: "VANISH",
    category: "production",
    description: "Vanish and coating operations",
    isActive: true,
    homePage: "/lvm/production/coating",
    aliases: ["VANISH"]
  },
  {
    legacyName: "Packing",
    uxoneCode: "PACKING",
    category: "production",
    description: "Product packing and shipping",
    isActive: true,
    homePage: "/lvm/production/packing",
    aliases: ["PACKING"]
  },

  // Support & Administrative Departments
  {
    legacyName: "Accounting",
    uxoneCode: "ACC",
    category: "support",
    description: "Accounting and financial operations",
    isActive: true,
    homePage: "/lvm/finance",
    aliases: ["ACC", "Finance"]
  },
  {
    legacyName: "Inventory",
    uxoneCode: "INV",
    category: "support",
    description: "Inventory management and control",
    isActive: true,
    homePage: "/lvm/inventory",
    aliases: ["INV"]
  },
  {
    legacyName: "Operations",
    uxoneCode: "OPS",
    category: "support",
    description: "General operations management",
    isActive: true,
    homePage: "/lvm/operations",
    aliases: ["OPS"]
  },
  {
    legacyName: "Research & Development",
    uxoneCode: "RD",
    category: "support",
    description: "Research and development",
    isActive: true,
    homePage: "/lvm/research-development",
    aliases: ["RD", "R&D"]
  },
  {
    legacyName: "Marketing",
    uxoneCode: "MKT",
    category: "support",
    description: "Marketing and communications",
    isActive: true,
    homePage: "/lvm/marketing",
    aliases: ["MKT"]
  }
];

// Business Unit Mapping
export const BUSINESS_UNIT_MAPPING = {
  "TRD": "Traditional",
  "LVM": "LVM Motors", 
  "HEV": "Hybrid Electric Vehicles"
};

// Helper Functions
export const getDepartmentMapping = (legacyName: string): DepartmentMapping | null => {
  if (!legacyName) return null;
  
  const normalized = legacyName.trim();
  
  // Direct match
  const directMatch = DEPARTMENT_MAPPING.find(mapping => 
    mapping.legacyName.toLowerCase() === normalized.toLowerCase() ||
    mapping.uxoneCode.toLowerCase() === normalized.toLowerCase()
  );
  
  if (directMatch) return directMatch;
  
  // Alias match
  const aliasMatch = DEPARTMENT_MAPPING.find(mapping => 
    mapping.aliases?.some(alias => 
      alias.toLowerCase() === normalized.toLowerCase()
    )
  );
  
  if (aliasMatch) return aliasMatch;
  
  // Partial match
  const partialMatch = DEPARTMENT_MAPPING.find(mapping => 
    mapping.legacyName.toLowerCase().includes(normalized.toLowerCase()) ||
    normalized.toLowerCase().includes(mapping.legacyName.toLowerCase())
  );
  
  return partialMatch || null;
};

export const getUXOneDepartmentCode = (legacyName: string): string => {
  const mapping = getDepartmentMapping(legacyName);
  return mapping?.uxoneCode || 'DEFAULT';
};

export const getLegacyDepartmentName = (uxoneCode: string): string => {
  const mapping = DEPARTMENT_MAPPING.find(m => m.uxoneCode === uxoneCode);
  return mapping?.legacyName || uxoneCode;
};

export const getDepartmentHomePage = (legacyName: string): string => {
  const mapping = getDepartmentMapping(legacyName);
  return mapping?.homePage || '/lvm';
};

export const getActiveDepartments = (): DepartmentMapping[] => {
  return DEPARTMENT_MAPPING.filter(mapping => mapping.isActive);
};

export const getDepartmentsByCategory = (category: DepartmentMapping['category']): DepartmentMapping[] => {
  return DEPARTMENT_MAPPING.filter(mapping => mapping.category === category);
};

export const getAllDepartmentCodes = (): string[] => {
  return DEPARTMENT_MAPPING.map(mapping => mapping.uxoneCode);
};

export const getAllLegacyNames = (): string[] => {
  return DEPARTMENT_MAPPING.map(mapping => mapping.legacyName);
};

// Validation Functions
export const isValidDepartmentCode = (code: string): boolean => {
  return DEPARTMENT_MAPPING.some(mapping => mapping.uxoneCode === code);
};

export const isValidLegacyName = (name: string): boolean => {
  return DEPARTMENT_MAPPING.some(mapping => 
    mapping.legacyName.toLowerCase() === name.toLowerCase() ||
    mapping.aliases?.some(alias => alias.toLowerCase() === name.toLowerCase())
  );
};

// Department Statistics
export const getDepartmentStats = () => {
  const total = DEPARTMENT_MAPPING.length;
  const active = DEPARTMENT_MAPPING.filter(m => m.isActive).length;
  const inactive = total - active;
  
  const byCategory = {
    core: DEPARTMENT_MAPPING.filter(m => m.category === 'core').length,
    production: DEPARTMENT_MAPPING.filter(m => m.category === 'production').length,
    support: DEPARTMENT_MAPPING.filter(m => m.category === 'support').length,
    manufacturing: DEPARTMENT_MAPPING.filter(m => m.category === 'manufacturing').length
  };
  
  return {
    total,
    active,
    inactive,
    byCategory,
    withHomePages: DEPARTMENT_MAPPING.filter(m => m.homePage).length,
    withoutHomePages: DEPARTMENT_MAPPING.filter(m => !m.homePage).length
  };
};
