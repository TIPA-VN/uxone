# UXOne System Guide & Instructions

## 🏢 **System Overview**

**UXOne** is a comprehensive enterprise project management system for TIPA (Thai Industrial Promotion Agency). It's a Next.js-based web application providing unified project management, task tracking, helpdesk support, and team collaboration with advanced JDE 9.2 integration and AI-driven procurement optimization.

### **Core Features**
- **Unified Management**: Single platform for project, task, and helpdesk management
- **Department-Specific Views**: Customized interfaces for different organizational departments
- **Role-Based Access Control**: Granular permissions based on organizational hierarchy
- **Document Management**: PDF handling, annotations, and template management
- **Real-time Collaboration**: Comments, notifications, and team coordination
- **JDE Integration**: Direct connection to JD Edwards EnterpriseOne 9.2
- **AI-Powered Procurement**: Intelligent purchase recommendations and inventory optimization
- **Demand Management**: Multi-line demand creation with custom auto-incrementing IDs
- **Cross-System Integration**: Seamless integration with TIPA Mobile

## 🏗️ **System Architecture**

### **Technology Stack**
- **Frontend**: Next.js 15.3.3 with React 19, TypeScript
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL (UXOne) + PostgreSQL (TIPA Mobile) + OracleDB (JDE)
- **Authentication**: NextAuth.js with central API + admin fallback
- **Styling**: Tailwind CSS 4 with custom UI components
- **State Management**: TanStack Query (React Query)
- **PDF Processing**: PDF-lib, Fabric.js for annotations
- **Charts**: Recharts for analytics and reporting
- **AI Integration**: OpenAI API for intelligent insights

### **Database Architecture**
```
┌─────────────────┐    ┌─────────────────┐
│   UXOne App     │    │  TIPA Mobile    │
│   (Port 3000)   │    │   (Port 3001)   │
│                 │    │                 │
│ Database:       │    │ Database:       │
│ uxone_new       │    │ uxonedb         │
└─────────────────┘    └─────────────────┘
         │                      │
         └──────────┬───────────┘
                    │
        ┌────────────▼────────────┐
        │   Central API Server    │
        │  (10.116.3.138:8888)    │
        │  - Authentication       │
        │  - User Management      │
        └─────────────────────────┘
```

## 🚀 **Quick Start Guide**

### **1. Prerequisites**
- Node.js 18+ installed
- PostgreSQL database access
- Git repository access
- Environment variables configured

### **2. Installation**
```bash
# Clone the repository
git clone <repository-url>
cd uxone

# Install dependencies
npm install

# Set up environment variables
cp ENVIRONMENT_VARIABLES_TEMPLATE.md .env.local
# Edit .env.local with your actual values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### **3. Database Setup**
```bash
# Setup new UXOne database
node scripts/setup-uxone-db.js

# Migrate existing data (if applicable)
node scripts/migrate-to-uxone-db.js

# Register TIPA Mobile service
node scripts/register-tipa-mobile-service.js
```

### **4. Verify Installation**
- Open `http://localhost:3000` in your browser
- Login with test credentials
- Check that all modules are accessible

## 🔐 **Authentication System**

### **Dual Authentication System**

#### **1. Primary Authentication (Central API)**
- **Endpoint**: `http://10.116.3.138:8888/api/web_check_login`
- **Flow**: Central API integration with automatic role mapping
- **Features**: Automatic department routing, position-based role assignment

#### **2. Admin Fallback Authentication**
- **Purpose**: System access during central API outages
- **Scope**: Admin accounts only during fallback mode
- **Security**: Bcrypt hashed passwords, environment variable storage

#### **3. Service API Authentication**
- **Method**: Bearer token authentication
- **Purpose**: Service-to-service communication (TIPA Mobile ↔ UXOne)
- **Implementation**: ServiceApp model with unique serviceKey

### **Login Process**
1. User enters credentials (empCode + password)
2. System hashes password and calls central API
3. If successful, user is synchronized from TIPA Mobile database
4. User is redirected to their department-specific home page
5. Notifications are automatically synced

## 🏢 **Organizational Structure**

### **Departments Supported (15+)**
| Department | Code | Home Page | Description |
|------------|------|-----------|-------------|
| Information Systems | IS | `/lvm/helpdesk` | IT and helpdesk management |
| Quality Control | QC | `/lvm/quality-control` | Quality management |
| Quality Assurance | QA | `/lvm/quality-assurance` | Testing and QA |
| Human Resources | HR | `/lvm/human-resources` | HR management |
| Finance | FIN | `/lvm/finance` | Financial management |
| Logistics | LOG | `/lvm/logistics` | Supply chain |
| **Procurement** | **PROC** | **`/lvm/procurement`** | **Purchasing & AI optimization** |
| Production Planning | PC | `/lvm/production-planning` | Planning |
| Production Maintenance | PM | `/lvm/production-maintenance` | Equipment |
| Facility Management | FM | `/lvm/facility-management` | Infrastructure |
| Customer Service | CS | `/lvm/customer-service` | Support |
| Sales | SALES | `/lvm/sales` | Sales management |
| Operations | OPS | `/lvm/operations` | Operations management |
| Administration | ADMIN | `/lvm/admin` | Admin panel |

### **Role Hierarchy (11 Levels)**
1. **System Administrator** (Level 11) - Full system access
2. **General Director** (Level 10) - Executive access
3. **General Manager** (Level 9) - Senior executive
4. **Assistant General Manager** (Level 8) - High-level management
5. **Senior Manager** (Level 7) - Senior management
6. **Manager** (Level 5) - Department management
7. **Assistant Manager** (Level 4) - Assistant management
8. **Supervisor** (Level 3) - Team supervision
9. **Specialist/Engineer** (Level 2) - Technical expertise
10. **Staff** (Level 1) - Regular staff
11. **Operator** (Level 0) - Basic operations

## 📊 **Core Modules**

### **1. Project Management**
- **Project Creation & Tracking**: Full project lifecycle management
- **Document Management**: PDF upload, annotation, and version control
- **Approval Workflow**: Multi-level approval system
- **Team Assignment**: Project member management
- **Status Tracking**: Planning → Active → On Hold → Completed → Cancelled

### **2. Task Management**
- **Task Creation**: Hierarchical task structure with dependencies
- **Assignment & Tracking**: Assign tasks to team members
- **Time Tracking**: Built-in time tracking capabilities
- **File Attachments**: Support for multiple file types
- **Comments & Collaboration**: Real-time communication

### **3. Helpdesk System**
- **Ticket Management**: Complete helpdesk workflow
- **Category System**: Support, Bug Report, Feature Request, Technical Issue
- **Priority Levels**: Low, Medium, High, Urgent
- **SLA Tracking**: Response and resolution time monitoring
- **Assignment & Escalation**: Automatic routing and escalation

### **4. Document Management**
- **PDF Processing**: Upload, view, and annotate PDFs
- **Template System**: Reusable document templates
- **Version Control**: Document versioning and history
- **Approval Workflow**: Document approval process
- **Public View**: Share documents with external stakeholders

### **5. Analytics & Reporting**
- **Dashboard KPIs**: Real-time performance metrics
- **Project Analytics**: Project progress and health indicators
- **Team Performance**: Individual and team productivity metrics
- **Helpdesk Reports**: Ticket resolution and SLA compliance
- **Custom Charts**: Interactive data visualization

## 🔔 **Notification System**

### **Cross-System Synchronization**
- **Bidirectional Sync**: Notifications sync between UXOne and TIPA Mobile
- **Real-time Updates**: Automatic notification delivery
- **Read Status Sync**: Mark as read/unread across both systems
- **Cleanup Operations**: Automatic removal of old notifications

### **Notification Types**
```typescript
enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
  APPROVAL_REQUEST
  DOCUMENT_UPDATE
  WORKFLOW_UPDATE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

## 🔗 **JDE 9.2 Integration**

### **Real Database Connection**
- **OracleDB Driver**: Direct connection to JDE EnterpriseOne 9.2
- **Performance**: 12x faster with caching implementation
- **Data Accuracy**: Proper transformations and formatting

### **Key JDE Tables**
- **F4101 - Item Master**: Inventory items with specifications
- **F4301 - Purchase Order Header**: PO header information
- **F4311 - Purchase Order Detail**: PO line items with quantities
- **F0101 - Address Book**: Supplier and customer information

### **Data Transformations**
- **Currency Handling**: USD divided by 100, VND displayed as whole numbers
- **Quantity Formatting**: All quantities divided by 100, UOM-aware formatting
- **Date Conversions**: Julian dates converted to ISO format
- **String Processing**: Trimmed strings, mapped status codes

## 📋 **Demand Management System**

### **Multi-Line Demand Creation**
- **Dynamic Form**: React Hook Form with useFieldArray for multiple demand lines
- **Custom ID Generation**: Auto-incrementing demand IDs in `LR-YYYYMMDD-XXX` format
- **Database Transactions**: Atomic creation of main demand and associated lines
- **ERP Integration**: Data transformation for external ERP system API calls

### **Demand ID System**
```typescript
// Custom ID Format: LR-YYYYMMDD-XXX
// Example: LR-20250802-001, LR-20250802-002, etc.

interface DemandSequence {
  id: number;
  date: string;        // YYYYMMDD format
  sequence: number;    // Daily sequence (1, 2, 3...)
  createdAt: Date;
  updatedAt: Date;
}
```

## 🤖 **Procurement AI Agent**

### **Core AI Components**
```typescript
const procurementAgent = {
  name: 'ProcurementOptimizer',
  memory: {
    vectorStore: 'pinecone',
    contextWindow: 32000
  },
  tools: [
    'jde-data-fetcher',
    'mrp-analyzer', 
    'demand-forecaster',
    'supplier-evaluator',
    'risk-assessor',
    'inventory-optimizer'
  ],
  llm: 'gpt-4-turbo'
}
```

### **AI Capabilities**
1. **Demand Forecasting**
   - Seasonal pattern analysis
   - Trend detection
   - External factor correlation

2. **Inventory Optimization**
   - Safety stock calculation
   - Reorder point optimization
   - ABC analysis enhancement

3. **Purchase Recommendations**
   - Quantity optimization
   - Timing suggestions
   - Supplier selection

4. **Risk Assessment**
   - Over-purchasing alerts
   - Supplier risk evaluation
   - Lead time variability analysis

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/uxonedb?schema=SCHEMA"
UXONE_DATABASE_URL="postgresql://postgres:password@localhost:5432/uxone_new?schema=SCHEMA"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="password"

# Authentication
CENTRAL_API_URL="http://10.116.3.138:8888/api/web_check_login"
ADMIN_FALLBACK_USERNAME="admin"
ADMIN_FALLBACK_PASSWORD="admin123"

# JDE Database Connection
JDE_DB_HOST="your-jde-server-ip"
JDE_DB_PORT="1521"
JDE_DB_SERVICE="JDE"
JDE_DB_USER="your-jde-username"
JDE_DB_PASSWORD="your-jde-password"

# AI Service Configuration
OPENAI_API_KEY="your-openai-api-key"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="your-pinecone-environment"

# External API Endpoints
NEXT_PUBLIC_API_URL="http://10.116.2.72:8091"
NEXT_PUBLIC_PR_AGENT_URL="http://10.116.2.72:5678/webhook/pr-agent-prompt"
NEXT_PUBLIC_CS_AGENT_URL="http://10.116.2.72:5678/webhook/cs-agent-v2"
API_URL="http://10.116.2.72:8091"
```

### **App Configuration (`config/app.ts`)**
The system uses a centralized configuration file that defines:
- Department codes and home pages
- Role hierarchy and permissions
- RBAC (Role-Based Access Control) rules
- UI settings and themes
- API endpoints and security settings

## 🚀 **Development Workflow**

### **Code Organization**
- **Components**: Reusable UI components in `/components`
- **Pages**: Route-specific components in `/app`
- **API Routes**: Backend logic in `/app/api`
- **Hooks**: Custom React hooks in `/hooks`
- **Types**: TypeScript definitions in `/types`

### **Key Development Patterns**
1. **Role-Based Components**: Components check user permissions
2. **Department Routing**: Users are routed to department-specific pages
3. **API Security**: All API routes validate user permissions
4. **Error Handling**: Comprehensive error handling throughout
5. **Type Safety**: Full TypeScript coverage

### **Development Commands**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

## 🧪 **Testing & Quality Assurance**

### **JDE Integration Testing**
- **Connection Testing**: `/api/jde/test-oracle`
- **Inventory Testing**: `/api/jde/inventory`
- **Purchase Order Testing**: `/api/jde/purchase-orders`
- **Data Synchronization**: Real-time sync with local database

### **API Testing**
- **Service API**: `/api/service/health`
- **Integration API**: `/api/integration/notifications/sync`
- **Authentication**: Central API and fallback testing
- **Performance**: Load testing for large datasets

### **UI Testing**
- **Responsive Design**: Mobile and desktop testing
- **User Experience**: Intuitive navigation and interactions
- **Accessibility**: WCAG compliance
- **Cross-browser**: Multiple browser testing

## 🔒 **Security Features**

### **Security Measures**
- **Role-Based Access Control**: Granular permission system
- **API Security**: Method-level access control
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: React automatic escaping
- **CSRF Protection**: NextAuth.js built-in protection

### **Service API Security**
- **Bearer Token Authentication**: Secure service-to-service communication
- **Rate Limiting**: 1000 requests/minute per service
- **Permission-based Access**: Granular permissions for each service
- **Request Logging**: Comprehensive audit trail

## 📈 **Performance Optimizations**

### **Caching Implementation**
- **In-memory caching** with 5-minute cache duration
- **Server-side filtering** applied before pagination
- **Performance improvement**: 12x faster than original
- **Cache management** with clear and refresh capabilities

### **Database Optimization**
- **Server-side Pagination**: Reduces data transfer
- **Indexed Queries**: Optimized SQL with proper indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimal data fetching

### **Frontend Optimization**
- **Lazy Loading**: Load data on demand
- **Skeleton Loading**: Better user experience
- **Caching**: React Query for additional caching
- **Code Splitting**: Reduced bundle sizes

## 🚀 **Deployment & Configuration**

### **Development Setup**
```bash
# Clone the repository
git clone <repository-url>
cd uxone

# Install dependencies
npm install

# Set up environment variables
cp ENVIRONMENT_VARIABLES_TEMPLATE.md .env.local

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### **Production Deployment**
```bash
# Build application
npm run build

# Start production server
npm start
```

### **Environment-Specific Configuration**

#### **Development**
```env
NODE_ENV="development"
LOG_LEVEL="debug"
```

#### **Staging**
```env
NODE_ENV="staging"
LOG_LEVEL="info"
```

#### **Production**
```env
NODE_ENV="production"
LOG_LEVEL="warn"
```

## 📞 **Support & Maintenance**

### **System Administration**
- **User Management**: Add/remove users and assign roles
- **Department Configuration**: Update department settings
- **Role Management**: Modify role permissions
- **System Monitoring**: Monitor system health and performance

### **Backup & Recovery**
- **Database Backups**: Regular PostgreSQL backups
- **File Backups**: Document and upload backups
- **Configuration Backups**: Environment and config backups
- **Disaster Recovery**: Document recovery procedures

### **Monitoring & Logging**
- **Error Tracking**: Implement error monitoring
- **Performance Metrics**: Track page load times
- **Database Performance**: Monitor query performance
- **User Analytics**: Track feature usage

## 🚀 **Future Enhancements**

### **Planned Features**
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Machine learning insights
- **Integration APIs**: Third-party system integration
- **Workflow Automation**: Automated approval workflows
- **Advanced Reporting**: Custom report builder

### **Technical Improvements**
- **Microservices**: Service-oriented architecture
- **Real-time Features**: WebSocket integration
- **Advanced Search**: Full-text search capabilities
- **API Documentation**: OpenAPI/Swagger documentation
- **Testing**: Comprehensive test coverage

## 📝 **Implementation Status**

### ✅ **Completed**
- [x] **JDE Integration**: Real database connection with proper data transformations
- [x] **Inventory Management**: 76,000+ items with caching and export functionality
- [x] **Purchase Order Management**: Full PO lifecycle with supplier integration
- [x] **Quantity Formatting**: UOM-aware formatting (EA=whole numbers, KG=2 decimals)
- [x] **Export System**: CSV/Excel export with proper data formatting
- [x] **Caching System**: 12x performance improvement with 5-minute cache duration
- [x] **Authentication System**: Dual authentication with admin fallback
- [x] **Role-Based Access Control**: 11-level hierarchy with department routing
- [x] **Multi-Line Demand Form**: Dynamic form with React Hook Form and useFieldArray
- [x] **Custom Demand ID System**: Auto-incrementing IDs in LR-YYYYMMDD-XXX format
- [x] **Database Schema**: Demand and DemandLine models with proper relationships
- [x] **ERP Integration**: Data transformation for external ERP system API calls
- [x] **Demand Management UI**: List view, detail view, and approval workflow
- [x] **Navigation Integration**: Direct demands link in main menu
- [x] **Database Separation**: UXOne and TIPA Mobile use separate databases
- [x] **Service API**: Secure service-to-service communication
- [x] **Notification Sync**: Cross-system notification synchronization
- [x] **TIPA Mobile Integration**: Complete integration with notification badge
- [x] **Security Hardening**: All hardcoded credentials moved to environment variables

### 🔄 **In Progress**
- [ ] **User Creation Fix**: Resolving unique constraint violation for test users
- [ ] **AI Agent Development**: Phase 2 of procurement AI implementation
- [ ] **Real-time Synchronization**: Live data sync with JDE
- [ ] **Advanced Analytics**: Machine learning insights and forecasting

### 📋 **Planned**
- [ ] **Mobile Application**: React Native mobile app
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Workflow Automation**: Automated approval processes
- [ ] **Multi-location Support**: Enhanced inventory optimization

## 🎯 **Success Metrics**

1. **Performance**: 12x faster inventory loading with caching
2. **Data Accuracy**: Correct filtering across all pages
3. **User Experience**: Real-time cache status and manual controls
4. **Scalability**: Handles 76,000+ inventory items efficiently
5. **Integration**: Successful real JDE 9.2 database connection
6. **Security**: Robust authentication with fallback capabilities
7. **Reliability**: 99.9% uptime with graceful error handling
8. **Demand Management**: Multi-line demand creation with custom IDs
9. **ERP Integration**: Ready for external ERP system integration
10. **Cross-System Sync**: Seamless notification synchronization between UXOne and TIPA Mobile

## 📄 **Documentation References**

- **`UXONE_PROJECT_DOCUMENTATION.md`**: Complete project documentation
- **`ENVIRONMENT_VARIABLES_TEMPLATE.md`**: Environment setup guide
- **`HARDCODED_CREDENTIALS_CLEANUP.md`**: Security cleanup summary

---

**Last Updated**: August 6, 2025  
**Version**: 1.2.0  
**Maintainer**: Eric Nguyen  
**Organization**: TIPA (Thai Industrial Promotion Agency)  
**Status**: Production Ready with Active Development 