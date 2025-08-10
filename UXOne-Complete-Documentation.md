# UXOne - Enterprise Management System

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Core Features](#core-features)
4. [Installation & Setup](#installation--setup)
5. [Configuration Guide](#configuration-guide)
6. [Authentication & Authorization](#authentication--authorization)
7. [User & Department Management](#user--department-management)
8. [Project & Task Management](#project--task-management)
9. [Document Management](#document-management)
10. [Helpdesk & Ticket System](#helpdesk--ticket-system)
11. [JDE Integration](#jde-integration)
12. [AI Agents & Automation](#ai-agents--automation)
13. [API & Webhook System](#api--webhook-system)
14. [Database Schema](#database-schema)
15. [Cross-System Integration](#cross-system-integration)
16. [Development Guidelines](#development-guidelines)
17. [Deployment & Monitoring](#deployment--monitoring)
18. [Troubleshooting](#troubleshooting)

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

## 🚀 Architecture & Technology Stack

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
- Dependency management
- Status tracking and progress monitoring
- File attachments and comments

### 7. **Document Management**
- File upload, versioning, and template system
- PDF processing and manipulation
- Document approval workflows
- Template management system

### 8. **Helpdesk System**
- Ticket creation and management
- Customer support automation
- SLA monitoring and reporting
- Knowledge base integration

### 9. **JDE Integration**
- Direct connection to JD Edwards EnterpriseOne 9.2
- Real-time data synchronization
- Inventory and purchase order management
- MRP and demand forecasting

### 10. **AI Agents**
- Procurement AI Agent for demand forecasting
- Customer Service AI Agent for support automation
- Webhook-based integration
- Intelligent recommendations

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

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed initial data
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## ⚙️ Configuration Guide

### Department Configuration System
UXOne uses a centralized department configuration system located in `config/app.ts`:

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
    },
    // ... more departments
  ]
}
```

### Available Components
- **DepartmentSelector**: Dropdown/select component
- **DepartmentCheckbox**: Multi-selection checkbox component
- **DepartmentRadio**: Single-selection radio component
- **DepartmentForm**: Comprehensive form example

### Configuration Options
- **Selection Types**: dropdown, checkbox, radio, form
- **Layout Options**: grid, list, columns, cards
- **Validation Rules**: Required/optional, min/max selections

---

## 🔐 Authentication & Authorization

### Central API Integration
UXOne integrates with a central authentication API that provides:
- Employee code validation
- Department and role information
- Position mapping to application roles

### Authentication Flow
1. User submits credentials (username/password)
2. UXOne hashes password and calls central API
3. Central API validates and returns employee data
4. UXOne creates/updates user in local database
5. User is authenticated with NextAuth.js session

### Role Mapping
Central API positions are mapped to UXOne roles:
- `SENIOR MANAGER` → `ADMIN`
- `MANAGER` → `MANAGER`
- `STAFF` → `STAFF`
- Default → `STAFF`

### Fallback Authentication
For development and admin access:
- Admin fallback credentials (configurable)
- Test accounts for development
- Central API availability detection

---

## 👥 User & Department Management

### User Management Features
- **Employee Synchronization**: Automatic sync with central API
- **Role-Based Access**: Granular permissions per department
- **Status Management**: Active/inactive user tracking
- **Profile Management**: Centralized user profiles

### Department Management Features
- **Centralized Configuration**: Single source of truth for all departments
- **Role Mapping**: Department-specific permissions and access
- **Visual Identification**: Color-coded department system
- **Home Page Routing**: Department-specific landing pages

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
  sortOrder: 1,
  permissions: ["admin", "user_management", "system_config"]
}
```

---

## 📊 Project & Task Management

### Project Management
- **Lifecycle Management**: Planning, Active, On-Hold, Completed, Cancelled
- **Status Tracking**: Real-time project status updates
- **Approval Workflows**: Multi-level approval processes
- **Resource Allocation**: Team member assignment and management

### Task Management
- **Comprehensive Tracking**: Status, priority, assignee, due dates
- **Dependency Management**: Task relationships and prerequisites
- **File Attachments**: Document and image support
- **Comment System**: Team collaboration and communication

### Task Statuses
- **TODO**: Not yet started
- **IN_PROGRESS**: Currently being worked on
- **REVIEW**: Ready for review/approval
- **COMPLETED**: Finished successfully
- **CANCELLED**: No longer needed

### Task Priorities
- **LOW**: Non-urgent tasks
- **MEDIUM**: Standard priority
- **HIGH**: Important tasks
- **URGENT**: Critical, time-sensitive tasks

---

## 📄 Document Management

### Core Features
- **File Upload**: Support for multiple file types (PDF, images, documents)
- **Version Control**: Document versioning and history
- **Template System**: Reusable document templates
- **Approval Workflows**: Document review and approval processes

### File Processing
- **PDF Manipulation**: Split, combine, and process PDF files
- **Image Handling**: Automatic image optimization and display
- **Document Numbers**: Automatic document numbering system
- **Access Control**: Role-based document permissions

### Document Types
- **Project Documents**: Project-related files and materials
- **Task Attachments**: Files associated with specific tasks
- **Templates**: Reusable document templates
- **Approval Documents**: Documents requiring review/approval

---

## 🎫 Helpdesk & Ticket System

### Ticket Management
- **Ticket Creation**: Customer and agent ticket creation
- **Status Tracking**: Open, In Progress, Pending, Resolved, Closed
- **Priority Management**: Low, Medium, High, Urgent
- **Category Classification**: Bug, Feature Request, Support, Technical Issue

### Support Features
- **SLA Monitoring**: Service level agreement tracking
- **Response Time Tracking**: First response and resolution time
- **Customer Management**: Customer information and history
- **Team Assignment**: Ticket assignment to support teams

### Ticket Workflow
1. **Creation**: Customer or agent creates ticket
2. **Assignment**: Ticket assigned to appropriate team/member
3. **Response**: First response within SLA timeframe
4. **Resolution**: Problem resolution and customer confirmation
5. **Closure**: Ticket closed after successful resolution

---

## 🔗 JDE Integration

### Connection Details
- **Host**: JD Edwards EnterpriseOne 9.2
- **Protocol**: Oracle Database connection
- **Authentication**: Username/password authentication
- **Data Access**: Read/write access to JDE tables

### Integrated Modules
- **Inventory Management**: Real-time inventory data
- **Purchase Orders**: PO creation and management
- **MRP System**: Material requirements planning
- **Sales Orders**: Order processing and tracking

### Data Synchronization
- **Real-time Updates**: Live data from JDE system
- **Bidirectional Sync**: Data updates in both systems
- **Error Handling**: Connection failure management
- **Performance Optimization**: Efficient data retrieval

---

## 🤖 AI Agents & Automation

### Procurement AI Agent
- **Demand Forecasting**: Predictive demand analysis
- **Inventory Optimization**: Stock level recommendations
- **Purchase Recommendations**: AI-powered procurement suggestions
- **Risk Assessment**: Supply chain risk analysis

### Customer Service AI Agent
- **Automated Responses**: Intelligent support automation
- **Ticket Classification**: Automatic ticket categorization
- **Knowledge Base Integration**: AI-powered knowledge retrieval
- **Customer Interaction Analysis**: Sentiment and pattern analysis

### Integration Methods
- **Webhook System**: Event-driven AI agent communication
- **RESTful APIs**: Standard HTTP integration
- **Real-time Processing**: Immediate AI response generation
- **Fallback Handling**: Graceful degradation on AI service failure

---

## 🔌 API & Webhook System

### RESTful APIs
- **Authentication**: Bearer token-based authentication
- **Service APIs**: External system integration endpoints
- **Internal APIs**: UXOne system management endpoints
- **Health Monitoring**: System status and health checks

### Webhook System
- **Event-Driven Architecture**: Real-time event processing
- **Multiple Event Types**: User, project, task, system events
- **Delivery Tracking**: Webhook delivery status monitoring
- **Retry Mechanism**: Automatic retry on delivery failure

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/session` - Session validation

#### Service APIs (External Access)
- `GET /api/service/health` - System health check
- `GET /api/service/notifications` - Notification retrieval
- `POST /api/service/notifications` - Notification creation

#### Integration APIs
- `GET /api/integration/notifications` - Cross-system notifications
- `POST /api/integration/sync-user` - User synchronization
- `PATCH /api/integration/notifications` - Notification updates

#### Internal APIs
- `GET /api/notifications` - UXOne notifications
- `POST /api/projects` - Project management
- `GET /api/demands` - Demand management
- `POST /api/documents` - Document management

---

## 🗄️ Database Schema

### Key Models

#### User Management
- **User**: Employee information with `emp_code` and role mapping
- **Notification**: Cross-system notification management
- **SystemConfig**: Global configuration settings

#### Project Management
- **Project**: Project lifecycle management
- **ProjectMember**: Team member assignments
- **ProjectComment**: Project communication

#### Task Management
- **Task**: Task tracking and assignment
- **TaskDependency**: Task relationships
- **TaskAttachment**: File attachments
- **TaskComment**: Task communication

#### Document Management
- **Document**: File management and templates
- **DocumentTemplate**: Reusable templates
- **DocumentNumber**: Automatic numbering system

#### Service Integration
- **ServiceApp**: External service registration
- **ServiceWebhook**: Webhook configuration
- **WebhookEvent**: Event tracking and delivery

### Database Naming Convention
- Uses snake_case for all database fields
- `emp_code` field for employee identification
- Consistent naming across UXOne and TIPA Mobile

---

## 🔄 Cross-System Integration

### TIPA Mobile Integration
- **Shared Database**: Both systems use the same PostgreSQL database
- **User Synchronization**: Automatic user data sync
- **Notification Sync**: Bidirectional notification management
- **Service Authentication**: Bearer token-based API access

### Integration Features
- **Real-time Data Synchronization**: Immediate updates across systems
- **Event-Driven Architecture**: Webhook-based communication
- **Service API with Authentication**: Secure external access
- **Health Monitoring and Logging**: System status tracking

### Service Registration
1. Register TIPA Mobile as a ServiceApp in UXOne
2. Generate unique service key (Bearer token)
3. Configure permissions and access levels

### API Usage Example
```javascript
// Example: Fetch notifications from UXOne
const response = await fetch('http://localhost:3000/api/service/notifications', {
  headers: {
    'Authorization': 'Bearer YOUR_SERVICE_KEY',
    'Content-Type': 'application/json'
  }
});
```

---

## 💻 Development Guidelines

### Code Structure
```
uxone/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (tipa)/            # TIPA-specific routes
│   └── auth/              # Authentication pages
├── components/            # React components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

### Development Commands
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Testing
npm run test
```

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Component Structure**: Consistent component organization

---

## 🚀 Deployment & Monitoring

### Production Setup
1. Configure production environment variables
2. Set up production database
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates
5. Configure monitoring and logging

### Environment Variables
Ensure all production environment variables are properly configured:
- Database connection strings
- API endpoints and credentials
- Authentication secrets
- External service URLs

### Health Monitoring
- **Database Connection Status**: Connection health checks
- **Service API Availability**: External service monitoring
- **Memory Usage Monitoring**: Resource utilization tracking
- **Response Time Tracking**: Performance metrics

### Logging
- **Authentication Attempts**: Login and access logging
- **API Request/Response Logging**: Request tracking
- **Error Tracking and Reporting**: Error monitoring
- **Performance Metrics**: System performance data

---

## 🧪 Testing & Quality Assurance

### Health Checks
```bash
# Check system health
curl http://localhost:3000/api/service/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Integration Testing
- **TIPA Mobile Integration**: Cross-system functionality
- **Notification Synchronization**: Bidirectional sync testing
- **JDE Data Retrieval**: ERP integration validation
- **AI Agent Responses**: Intelligent system testing

### Performance Testing
- **Load Testing**: System capacity validation
- **Stress Testing**: Breaking point identification
- **Database Performance**: Query optimization
- **API Response Times**: Endpoint performance

---

## 🔧 Troubleshooting

### Common Issues

#### Authentication Problems
- **Central API Unavailable**: Check API endpoint accessibility
- **Database Connection**: Verify database connection string
- **Session Expiry**: Check NextAuth configuration
- **Role Mapping**: Verify position-to-role mapping

#### Integration Issues
- **Webhook Failures**: Check webhook endpoint accessibility
- **JDE Connection**: Verify Oracle database connection
- **TIPA Mobile Sync**: Check service authentication
- **AI Agent Timeouts**: Verify AI service availability

#### Performance Issues
- **Slow Database Queries**: Check query optimization
- **Memory Leaks**: Monitor memory usage patterns
- **API Timeouts**: Check external service response times
- **File Upload Issues**: Verify storage configuration

### Debug Tools
- **Prisma Studio**: Database inspection and management
- **Next.js DevTools**: Development debugging
- **Browser DevTools**: Frontend debugging
- **API Testing**: Postman or similar tools

### Support Resources
- **Documentation**: This comprehensive guide
- **Health Endpoints**: System status monitoring
- **Development Team**: Technical support contact
- **Issue Tracking**: Bug report and feature request system

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support and questions:
- Check this documentation
- Review the health endpoint (`/api/service/health`)
- Contact the development team
- Use the issue tracking system

---

**UXOne** - Enterprise Management System v1.0.0

*Last Updated: December 2024*  
*Version: 1.0.0*  
*Documentation Version: 2.0*
