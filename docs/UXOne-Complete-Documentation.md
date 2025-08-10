# UXOne - Complete System Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Core Features](#core-features)
4. [Department Management System](#department-management-system)
5. [User Management & Authentication](#user-management--authentication)
6. [Project & Task Management](#project--task-management)
7. [Document Management](#document-management)
8. [Helpdesk & Ticket System](#helpdesk--ticket-system)
9. [Email Webhook System](#email-webhook-system)
10. [JDE Integration](#jde-integration)
11. [AI Agents & Automation](#ai-agents--automation)
12. [API & Webhook System](#api--webhook-system)
13. [Database Schema](#database-schema)
14. [Installation & Setup](#installation--setup)
15. [Configuration Guide](#configuration-guide)
16. [Development Guidelines](#development-guidelines)
17. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Overview

**UXOne** is a comprehensive enterprise management system built with Next.js, designed to provide a unified platform for project management, task tracking, document management, and cross-system integration. The system serves as the central hub for TIPA organization's digital operations, integrating with JD Edwards ERP, mobile applications, and external services.

### Key Characteristics
- **Unified Platform**: Single system for multiple business functions
- **Multi-Department Support**: Role-based access control across departments
- **Real-time Integration**: Seamless data synchronization with external systems
- **AI-Powered**: Intelligent automation for procurement and customer service
- **Scalable Architecture**: Modern tech stack with enterprise-grade reliability

---

## �� Architecture & Technology Stack

### Frontend Technologies
- **Next.js 15.3.3**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript 5.8.3**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives

### Backend Technologies
- **Next.js API Routes**: Server-side API endpoints
- **Prisma ORM 4.16.2**: Database abstraction layer
- **PostgreSQL**: Primary database with snake_case convention
- **Oracle Database**: JD Edwards integration via oracledb

### Authentication & Security
- **NextAuth.js 5**: Authentication framework
- **Central API Integration**: External authentication service
- **JWT Tokens**: Secure session management
- **Role-Based Access Control (RBAC)**: Granular permission system

### Integration & Communication
- **Webhook System**: Event-driven architecture
- **RESTful APIs**: Standard HTTP interfaces
- **SOAP Integration**: Legacy system connectivity
- **Real-time Notifications**: Cross-system synchronization

---

## ⭐ Core Features

### 1. **Authentication & Authorization**
- Central API integration with role-based access
- Multi-factor authentication support
- Session management with JWT tokens
- Granular permission system

### 2. **User Management**
- Employee data synchronization across systems
- Department-based role mapping
- Active/inactive user status management
- Centralized user profiles

### 3. **Department Management**
- Multi-department support with role mapping
- Centralized configuration system
- Department-specific home pages
- Color-coded department identification

### 4. **Notification System**
- Real-time notifications with cross-system sync
- Email and in-app notifications
- Webhook-based event delivery
- Notification preferences management

### 5. **Project Management**
- Full project lifecycle management
- Project status tracking
- Approval workflows
- Resource allocation

### 6. **Task Management**
- Comprehensive task tracking and assignment
- Task dependencies and relationships
- Priority and status management
- Time tracking and reporting

### 7. **Document Management**
- File upload and versioning
- Document template system
- PDF manipulation and annotation
- Document numbering system

---

## 🏢 Department Management System

The department management system provides a centralized configuration approach that consolidates all department-related data across the application.

### Configuration Structure

#### Master Department List
All departments are defined in `config/app.ts` under `APP_CONFIG.departments.list`:

```typescript
departments: {
  list: [
    {
      value: "IS",
      label: "Information Systems", 
      code: "IS",
      color: "bg-blue-600",
      description: "Information systems and IT management",
      isActive: true,
      sortOrder: 1
    }
    // ... more departments
  ]
}
```

#### Department Categories
```typescript
categories: {
  technical: ["IS", "HELPDESK", "QA", "QC", "PM", "FM"],
  business: ["LOG", "PROC", "PC", "HR", "CS", "FIN"],
  support: ["RD", "MKT", "SALES", "OPS", "ADMIN"]
}
```

#### Department Home Pages
```typescript
departmentHomePages: {
  IS: "/lvm/helpdesk",
  QC: "/lvm/quality-control",
  QA: "/lvm/quality-assurance",
  HR: "/lvm/human-resources",
  FIN: "/lvm/finance",
  LOG: "/lvm/logistics",
  PROC: "/lvm/procurement",
  // ... more mappings
}
```

### Quick Actions

#### Adding a New Department
1. **Open the config file**: `code config/app.ts`
2. **Add to `departments.list` array**:
   ```typescript
   {
     value: "NEW_DEPT",
     label: "New Department",
     code: "NEW_DEPT",
     color: "bg-cyan-500",
     description: "Description",
     isActive: true,
     sortOrder: 18
   }
   ```
3. **Update related configurations**:
   - `departmentCodes` - Add code mapping
   - `departmentHomePages` - Add route mapping
   - `categories` - Add to appropriate category
   - `permissions` - Add to features and hierarchy

#### Modifying an Existing Department
1. **Find the department in `departments.list`**
2. **Update the desired fields**
3. **Update all references** if you changed `value` or `code`

#### Disabling a Department
1. **Mark as inactive**: Set `isActive: false`
2. **Remove from active configurations**
3. **Test that it no longer appears in dropdowns**

### Available Colors
```typescript
// Blue variants
"bg-blue-500", "bg-blue-600", "bg-blue-700"

// Green variants  
"bg-green-500", "bg-green-600", "bg-emerald-500"

// Purple variants
"bg-purple-500", "bg-violet-500", "bg-indigo-500"

// Red variants
"bg-red-500", "bg-rose-500", "bg-pink-500"

// Yellow/Orange variants
"bg-yellow-500", "bg-orange-500", "bg-amber-500"

// Gray variants
"bg-gray-500", "bg-slate-500", "bg-zinc-500"

// Teal/Cyan variants
"bg-teal-500", "bg-cyan-500"
```

### Best Practices
- **Naming Conventions**: Use UPPERCASE for `value` and `code`, Title Case for `label`
- **Sort Order**: Use increments of 1, 5, or 10 for easier reordering
- **Validation**: Ensure `value` and `code` are unique, validate color classes
- **Testing**: Restart development server after changes, test all components

---

## 👥 User Management & Authentication

### User Model
```typescript
model User {
  id                       String    @id @default(cuid())
  username                 String    @unique
  name                     String?
  hashedPassword           String?
  email                    String?   @unique
  image                    String?
  department               String?
  departmentName           String?
  role                     String?
  isActive                 Boolean   @default(true)
  centralDepartment        String?
  emp_code                 String?   @unique
  // ... relationships
}
```

### Role Hierarchy
The system supports a comprehensive role hierarchy:
- **Executive Level**: ADMIN, GENERAL_DIRECTOR, GENERAL_MANAGER
- **Management Level**: ASSISTANT_GENERAL_MANAGER, SENIOR_MANAGER, MANAGER
- **Supervisory Level**: SUPERVISOR, LINE_LEADER
- **Specialist Level**: CHIEF_SPECIALIST, TECHNICAL_SPECIALIST, SENIOR_SPECIALIST
- **Staff Level**: SPECIALIST, ENGINEER, TECHNICIAN, DEVELOPER
- **Support Level**: SUPPORT, SENIOR_ASSOCIATE, ASSOCIATE, STAFF, OPERATOR
- **Entry Level**: INTERN

### Authentication Flow
1. **User Login**: Central API integration
2. **Role Assignment**: Based on user profile
3. **Permission Check**: Feature and page access validation
4. **Session Management**: JWT token-based sessions

### Permission System
```typescript
permissions: {
  features: {
    helpdesk: ["IS", "HELPDESK", "CS"],
    procurement: ["PROC", "LOG", "PC"],
    // ... more features
  },
  hierarchy: {
    level1: ["ADMIN", "IS"],
    level2: ["HR", "FIN", "OPS"],
    level3: ["LOG", "PROC", "PC", "QA", "QC", "PM", "FM", "CS", "RD", "MKT", "SALES"]
  }
}
```

---

## 📊 Project & Task Management

### Project Model
```typescript
model Project {
  id                String           @id @default(cuid())
  title             String
  description       String?
  status            ProjectStatus    @default(DRAFT)
  approvalState     ApprovalState   @default(PENDING)
  startDate         DateTime?
  dueDate           DateTime?
  priority          TaskPriority     @default(MEDIUM)
  department        String?
  budget            Float?
  tags              String[]
  // ... relationships
}
```

### Task Model
```typescript
model Task {
  id                String           @id @default(cuid())
  title             String
  description       String?
  status            TaskStatus       @default(TODO)
  priority          TaskPriority     @default(MEDIUM)
  dueDate           DateTime?
  assignedToId      String?
  projectId         String?
  // ... relationships
}
```

### Project Statuses
- **DRAFT**: Initial planning phase
- **ACTIVE**: Currently in progress
- **ON_HOLD**: Temporarily suspended
- **COMPLETED**: Successfully finished
- **CANCELLED**: Terminated project

### Task Statuses
- **TODO**: Not yet started
- **IN_PROGRESS**: Currently being worked on
- **REVIEW**: Under review or testing
- **DONE**: Completed successfully
- **BLOCKED**: Unable to proceed

### Task Priorities
- **LOW**: Low priority, can be delayed
- **MEDIUM**: Normal priority
- **HIGH**: Important, should be prioritized
- **URGENT**: Critical, immediate attention required

---

## 📄 Document Management

### Document Model
```typescript
model Document {
  id                String           @id @default(cuid())
  title             String
  description       String?
  fileName          String
  filePath          String
  fileSize          Int
  mimeType          String
  version           String           @default("1.0")
  status            String           @default("active")
  tags              String[]
  // ... relationships
}
```

### Document Template System
```typescript
model DocumentTemplate {
  id                String           @id @default(cuid())
  name              String
  description       String?
  templateType      String
  content           String
  variables         String[]
  isActive          Boolean          @default(true)
  // ... relationships
}
```

### Document Numbering System
```typescript
model DocumentNumber {
  id                String           @id @default(cuid())
  prefix            String
  sequence          Int
  year              Int
  month             Int
  status            DocumentNumberStatus @default(ACTIVE)
  // ... relationships
}
```

### Features
- **File Upload**: Support for multiple file types
- **Version Control**: Document versioning and history
- **Template System**: Predefined document templates
- **PDF Manipulation**: Split, combine, and annotate PDFs
- **Document Numbering**: Automatic sequence generation

---

## 🎫 Helpdesk & Ticket System

### Ticket Model
```typescript
model Ticket {
  id               String             @id @default(cuid())
  ticketNumber     String             @unique
  title            String
  description      String
  status           TicketStatus       @default(OPEN)
  priority         TicketPriority     @default(MEDIUM)
  category         TicketCategory     @default(SUPPORT)
  customerEmail    String
  customerName     String
  assignedToId     String?
  assignedTeam     String?
  // ... relationships
}
```

### Ticket Categories
- **BUG**: Software bugs and errors
- **FEATURE_REQUEST**: New feature requests
- **TECHNICAL_ISSUE**: Technical problems
- **SUPPORT**: General support questions
- **GENERAL**: General inquiries

### Ticket Priorities
- **LOW**: Low priority issues
- **MEDIUM**: Normal priority
- **HIGH**: Important issues
- **URGENT**: Critical problems requiring immediate attention

### Ticket Statuses
- **OPEN**: New ticket, not yet assigned
- **IN_PROGRESS**: Being worked on
- **WAITING_FOR_CUSTOMER**: Waiting for customer response
- **RESOLVED**: Issue resolved
- **CLOSED**: Ticket closed

### Permission Matrix
```typescript
permissionMatrix: {
  EXECUTIVE: {
    permissions: {
      viewAll: true,
      assign: true,
      resolve: true,
      close: true,
      delete: true
    }
  },
  MANAGER: {
    permissions: {
      viewAll: true,
      assign: true,
      resolve: true,
      close: true,
      delete: false
    }
  }
  // ... more roles
}
```

---

## �� Email Webhook System

The Email Webhook System automatically converts incoming emails to support tickets in the UXOne system.

### Features
- **Automatic Email-to-Ticket Conversion**: Converts emails to tickets based on content
- **Smart Category Detection**: Determines ticket category using keyword analysis
- **Priority Classification**: Assigns priority levels based on email content
- **Team Assignment**: Routes tickets to appropriate teams
- **Email Reply Handling**: Detects replies and adds them as comments

### Setup Instructions

#### 1. Environment Variables
```bash
# Email webhook secret for authentication
EMAIL_WEBHOOK_SECRET=your-secure-webhook-secret-here

# Support email address (optional, for reference)
SUPPORT_EMAIL=test-support@yourcompany.com
```

#### 2. Email Service Configuration
Configure your email service provider to send webhooks to:
```
POST https://your-domain.com/api/email-webhook
```

**Required Headers:**
```
Authorization: Bearer your-secure-webhook-secret-here
Content-Type: application/json
```

**Expected Email Data Format:**
```json
{
  "from": "John Doe <john.doe@example.com>",
  "to": "test-support@yourcompany.com",
  "subject": "URGENT: System is down",
  "text": "The system has been down for 2 hours...",
  "html": "<p>The system has been down for 2 hours...</p>",
  "messageId": "unique-message-id",
  "timestamp": "2024-01-15T10:30:00Z",
  "attachments": []
}
```

### Category Detection Logic

| Category | Keywords |
|----------|----------|
| BUG | bug, error, crash, broken, not working, failed, issue |
| FEATURE_REQUEST | feature, enhancement, improvement, new, request |
| TECHNICAL_ISSUE | technical, system, server, database, api, integration |
| SUPPORT | help, support, question, how to, assistance |
| GENERAL | general, inquiry, info, information |

### Priority Detection Logic

| Priority | Keywords |
|----------|----------|
| URGENT | urgent, critical, emergency, asap, immediate, broken, down |
| HIGH | important, high priority, blocking |
| LOW | low priority, when possible, suggestion, nice to have |
| MEDIUM | (default) |

### Team Assignment

| Category | Assigned Team |
|----------|---------------|
| BUG | IS (Information Systems) |
| FEATURE_REQUEST | IS (Information Systems) |
| TECHNICAL_ISSUE | IS (Information Systems) |
| SUPPORT | CS (Customer Service) |
| GENERAL | CS (Customer Service) |

### Email Reply Detection
The system automatically detects email replies and handles them differently:
- **Subject Matching**: Compares email subject to existing ticket titles
- **Sender Matching**: Ensures reply is from same sender
- **Time Window**: Looks for matches within last 30 days
- **Reply Prefixes**: Automatically removes common reply prefixes

---

## 🔗 JDE Integration

### Integration Overview
UXOne integrates directly with JD Edwards EnterpriseOne 9.2 for real-time data synchronization and business process automation.

### Supported Modules
- **Inventory Management**: Item master data, location tracking
- **Purchase Orders**: PO creation, modification, and tracking
- **Sales Orders**: Sales order management and fulfillment
- **MRP Messages**: Material requirements planning
- **Receipt Management**: Goods receipt processing

### Database Models
```typescript
model ItemMaster {
  id                String   @id @default(cuid())
  itemNumber        String   @unique
  description       String
  category          String?
  unitOfMeasure     String?
  // ... more fields
}

model PurchaseOrderHeader {
  id                String   @id @default(cuid())
  poNumber          String   @unique
  vendorId          String?
  orderDate         DateTime?
  status            String?
  // ... more fields
}

model SalesOrderDetail {
  id                String   @id @default(cuid())
  orderNumber       String?
  lineNumber        Int?
  itemNumber        String?
  quantity          Float?
  // ... more fields
}
```

### Connection Configuration
```typescript
// JDE Connection settings
JDE_HOST="10.116.2.72"
JDE_PORT="1521"
JDE_SERVICE="JDE"
JDE_USERNAME="your_jde_username"
JDE_PASSWORD="your_jde_password"
```

---

## 🤖 AI Agents & Automation

### Procurement AI Agent
- **Purpose**: Demand forecasting and optimization
- **Endpoint**: `/api/jde/pr-agent-prompt`
- **Features**: 
  - Demand analysis and forecasting
  - Purchase recommendation optimization
  - Risk assessment and mitigation
  - Cost optimization suggestions

### Customer Service AI Agent
- **Purpose**: Support automation and ticket routing
- **Endpoint**: `/api/jde/cs-agent-v2`
- **Features**:
  - Intelligent ticket categorization
  - Automated response suggestions
  - Customer sentiment analysis
  - Escalation recommendations

### AI Integration
```typescript
// AI Services configuration
NEXT_PUBLIC_PR_AGENT_URL="http://10.116.2.72:5678/webhook/pr-agent-prompt"
NEXT_PUBLIC_CS_AGENT_URL="http://10.116.2.72:5678/webhook/cs-agent-v2"
```

---

## 🌐 API & Webhook System

### RESTful APIs
UXOne provides comprehensive REST APIs for external system integration:

- **User Management**: `/api/users/*`
- **Project Management**: `/api/projects/*`
- **Task Management**: `/api/tasks/*`
- **Document Management**: `/api/documents/*`
- **Helpdesk**: `/api/tickets/*`
- **Notifications**: `/api/notifications/*`

### Webhook System
Event-driven architecture for real-time updates:

```typescript
model WebhookEvent {
  id                String   @id @default(cuid())
  eventType         String
  payload           String
  status            String   @default("pending")
  retryCount        Int      @default(0)
  // ... more fields
}

model WebhookDelivery {
  id                String   @id @default(cuid())
  webhookId         String
  eventId           String
  status            String
  responseCode      Int?
  // ... more fields
}
```

### Service API Authentication
Bearer token-based authentication for service-to-service communication:
```typescript
// Service API configuration
NEXT_PUBLIC_API_URL="http://10.116.2.72:8091"
API_URL="http://10.116.2.72:8091"
```

---

## 🗄️ Database Schema

### Core Models Overview

#### User & Authentication
- **User**: Core user profiles and authentication
- **Notification**: User notification system
- **Comment**: Generic commenting system

#### Project Management
- **Project**: Project definitions and metadata
- **ProjectMember**: Project team assignments
- **ProjectComment**: Project-specific comments

#### Task Management
- **Task**: Individual task definitions
- **TaskDependency**: Task relationships and dependencies
- **TaskAttachment**: Task-related file attachments
- **TaskComment**: Task-specific comments

#### Document Management
- **Document**: File storage and metadata
- **DocumentTemplate**: Reusable document templates
- **DocumentNumber**: Automatic numbering system

#### Helpdesk System
- **Ticket**: Support ticket management
- **TicketComment**: Ticket discussions and updates
- **TicketAttachment**: Ticket-related files

#### Business Operations
- **Demand**: Demand management system
- **DemandLine**: Individual demand line items
- **ServiceApp**: Service application management
- **ServiceApproval**: Service approval workflows

#### Integration & External Systems
- **ItemMaster**: JDE inventory integration
- **PurchaseOrderHeader**: JDE PO integration
- **SalesOrderDetail**: JDE sales integration
- **WebhookEvent**: External system integration

### Database Conventions
- **Naming**: snake_case for database fields
- **Relationships**: Proper foreign key constraints
- **Indexing**: Optimized for common query patterns
- **Migrations**: Version-controlled schema changes

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Access to JD Edwards EnterpriseOne 9.2
- Central Authentication API access

### 1. Clone Repository
```bash
git clone <repository-url>
cd uxone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` with the following variables:

```env
# Database Configuration
UXONE_DATABASE_URL="postgresql://postgres:password@10.116.2.72:5432/uxone_new?schema=SCHEMA"

# Authentication
CENTRAL_API_URL="http://10.116.3.138:8888/api/web_check_login"

# Admin Fallback (for development)
ADMIN_FALLBACK_USERNAME="admin"
ADMIN_FALLBACK_PASSWORD="admin123"
ADMIN_FALLBACK_ROLE="GENERAL DIRECTOR"
ADMIN_FALLBACK_NAME="System Administrator"
ADMIN_FALLBACK_EMAIL="admin@tipa.co.th"
ADMIN_FALLBACK_DEPARTMENT="IT"
ADMIN_FALLBACK_DEPARTMENT_NAME="Information Technology"

# JDE Integration
JDE_HOST="10.116.2.72"
JDE_PORT="1521"
JDE_SERVICE="JDE"
JDE_USERNAME="your_jde_username"
JDE_PASSWORD="your_jde_password"

# AI Services
NEXT_PUBLIC_PR_AGENT_URL="http://10.116.2.72:5678/webhook/pr-agent-prompt"
NEXT_PUBLIC_CS_AGENT_URL="http://10.116.2.72:5678/webhook/cs-agent-v2"

# External APIs
NEXT_PUBLIC_API_URL="http://10.116.2.72:8091"
API_URL="http://10.116.2.72:8091"

# Email Webhook
EMAIL_WEBHOOK_SECRET=your-secure-webhook-secret-here
SUPPORT_EMAIL=test-support@yourcompany.com
```

### 4. Database Setup
```bash
# Run database migrations
npx prisma migrate dev

# Seed initial data
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:8090`

---

## ⚙️ Configuration Guide

### Application Configuration
The main configuration file is located at `config/app.ts` and contains:

- **Department Management**: Complete department definitions
- **Role-Based Access Control**: Permission matrices and hierarchies
- **System Settings**: Application-wide configurations
- **Integration Settings**: External service configurations

### Department Configuration
```typescript
// Example department configuration
{
  value: "IS",
  label: "Information Systems",
  code: "IS",
  color: "bg-blue-600",
  description: "Information systems and IT management",
  isActive: true,
  sortOrder: 1
}
```

### Permission Configuration
```typescript
// Example permission configuration
permissions: {
  features: {
    helpdesk: ["IS", "HELPDESK", "CS"],
    procurement: ["PROC", "LOG", "PC"],
    projectManagement: ["PM", "ADMIN"]
  },
  hierarchy: {
    level1: ["ADMIN", "IS"],
    level2: ["HR", "FIN", "OPS"],
    level3: ["LOG", "PROC", "PC", "QA", "QC", "PM", "FM", "CS", "RD", "MKT", "SALES"]
  }
}
```

### Component Configuration
```typescript
// Example component configuration
selection: {
  dropdown: {
    includeAll: true,
    allLabel: "All Departments",
    allValue: "ALL",
    placeholder: "Select Department",
    showDescription: false,
    validation: {
      required: true,
      minLength: 1,
      maxLength: 1
    }
  }
}
```

---

## 💻 Development Guidelines

### Code Structure
- **App Router**: Next.js 15 App Router structure
- **Component Organization**: Logical grouping by feature
- **Type Safety**: Full TypeScript implementation
- **State Management**: React hooks and TanStack Query

### Best Practices

#### 1. Always Use Utility Functions
```typescript
// ✅ Good
import { getDepartmentOptions } from "@/config/app";
const departments = getDepartmentOptions('dropdown');

// ❌ Avoid
const departments = APP_CONFIG.departments.list;
```

#### 2. Validate User Input
```typescript
import { validateDepartmentSelection } from "@/config/app";

const validation = validateDepartmentSelection(selectedDepts, 'checkbox');
if (!validation.isValid) {
  // Handle validation error
}
```

#### 3. Use Type-Safe Components
```typescript
// ✅ Good
import { DepartmentSelector } from "@/components/ui/department-selector";

// ❌ Avoid
<select>
  {departments.map(dept => (
    <option key={dept.value} value={dept.value}>
      {dept.label}
    </option>
  ))}
</select>
```

#### 4. Handle Loading States
```typescript
import { getDepartmentOptions } from "@/config/app";

function MyComponent() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const depts = getDepartmentOptions('dropdown');
    setDepartments(depts);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading departments...</div>;

  return <DepartmentSelector options={departments} />;
}
```

### File Organization
```
uxone/
├── app/                    # Next.js App Router
│   ├── (tipa)/           # TIPA-specific routes
│   │   └── lvm/         # Main application routes
│   ├── api/              # API endpoints
│   └── auth/             # Authentication routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── [feature]/        # Feature-specific components
├── config/                # Configuration files
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── prisma/                # Database schema and migrations
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Department not appearing in dropdowns
- ✅ Check that `isActive: true`
- ✅ Verify the department is in the correct categories
- ✅ Restart the development server

#### 2. TypeScript errors
- ✅ Ensure all required fields are present
- ✅ Check that `value` and `code` are unique
- ✅ Verify color class exists in Tailwind CSS

#### 3. Component not updating
- ✅ Clear browser cache
- ✅ Restart the development server
- ✅ Check for console errors

#### 4. Authentication issues
- ✅ Verify environment variables
- ✅ Check central API connectivity
- ✅ Validate JWT token configuration

#### 5. Database connection errors
- ✅ Verify database URL format
- ✅ Check network connectivity
- ✅ Validate database credentials

#### 6. JDE integration issues
- ✅ Verify Oracle database connectivity
- ✅ Check JDE service availability
- ✅ Validate connection parameters

### Getting Help

If you encounter issues:

1. **Check the console** for error messages
2. **Verify configuration** is correct
3. **Test with simple examples** first
4. **Review the logs** for detailed error information
5. **Contact the development team** for complex issues

### Debug Mode
Enable debug mode for detailed logging:
```bash
# Set debug environment variable
DEBUG=* npm run dev
```

---

## 🔮 Future Enhancements

### Planned Features
- [ ] **Department Hierarchy Visualization**: Interactive org chart display
- [ ] **Department-Specific Themes**: Custom branding per department
- [ ] **Advanced Filtering and Search**: Enhanced data discovery
- [ ] **Department Analytics and Reporting**: Performance metrics and insights
- [ ] **Integration with External Systems**: Additional ERP and CRM integrations

### AI Enhancements
- [ ] **Natural Language Processing**: Advanced content analysis
- [ ] **Predictive Analytics**: Demand forecasting and trend analysis
- [ ] **Automated Workflows**: Intelligent process automation
- [ ] **Chatbot Integration**: AI-powered customer support

### Mobile Enhancements
- [ ] **Progressive Web App**: Enhanced mobile experience
- [ ] **Offline Capabilities**: Work without internet connection
- [ ] **Push Notifications**: Real-time mobile alerts
- [ ] **Mobile-Optimized UI**: Responsive design improvements

---

## 📞 Support & Contact

### Documentation
- **This Guide**: Complete system documentation
- **API Reference**: Detailed API documentation
- **Component Library**: UI component documentation
- **Migration Guides**: Database and configuration updates

### Development Team
For technical support and development questions:
- **Email**: development@tipa.co.th
- **Internal Chat**: UXOne development channel
- **Issue Tracking**: GitHub Issues or internal system

### User Support
For end-user support and training:
- **Helpdesk**: Create tickets through the helpdesk system
- **Training Materials**: User guides and video tutorials
- **Department Contacts**: Department-specific support channels

---

## 📝 Changelog

### Version 1.0.0 (Current)
- **Initial Release**: Complete enterprise management system
- **Core Features**: User management, project management, task tracking
- **Department System**: Centralized department configuration
- **JDE Integration**: Direct ERP system connectivity
- **AI Agents**: Procurement and customer service automation
- **Webhook System**: Event-driven architecture

### Upcoming Releases
- **Version 1.1.0**: Enhanced reporting and analytics
- **Version 1.2.0**: Advanced workflow automation
- **Version 2.0.0**: Major UI/UX overhaul and mobile optimization

---

## 📄 License & Legal

This documentation and the UXOne system are proprietary to TIPA organization. All rights reserved.

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Documentation Version: Complete System Guide*
