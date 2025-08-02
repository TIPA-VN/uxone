# UXOne Complete Project Context

## 🏢 **Project Overview**

**UXOne** is a comprehensive enterprise project management system developed for TIPA (Thai Industrial Promotion Agency). It's a Next.js-based web application that provides unified project management, task tracking, helpdesk support, and team collaboration capabilities across multiple departments with advanced JDE 9.2 integration and AI-driven procurement optimization.

### **Core Purpose**
- **Unified Management**: Single platform for project, task, and helpdesk management
- **Department-Specific Views**: Customized interfaces for different organizational departments
- **Role-Based Access Control**: Granular permissions based on organizational hierarchy
- **Document Management**: PDF handling, annotations, and template management
- **Real-time Collaboration**: Comments, notifications, and team coordination
- **JDE Integration**: Direct connection to JD Edwards EnterpriseOne 9.2
- **AI-Powered Procurement**: Intelligent purchase recommendations and inventory optimization
- **Demand Management**: Multi-line demand creation with custom auto-incrementing IDs

## 🏗️ **System Architecture**

### **Technology Stack**
- **Frontend**: Next.js 15.3.3 with React 19, TypeScript
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL (local) + OracleDB (JDE integration)
- **Authentication**: NextAuth.js with central API + admin fallback
- **Styling**: Tailwind CSS 4 with custom UI components
- **State Management**: TanStack Query (React Query)
- **PDF Processing**: PDF-lib, Fabric.js for annotations
- **Charts**: Recharts for analytics and reporting
- **AI Integration**: OpenAI API for intelligent insights

### **Key Dependencies**
```json
{
  "next": "15.3.3",
  "react": "^19.0.0",
  "@prisma/client": "^4.16.2",
  "next-auth": "^5.0.0-beta.29",
  "@tanstack/react-query": "^5.80.10",
  "pdf-lib": "^1.17.1",
  "fabric": "^6.7.1",
  "recharts": "^2.15.3",
  "oracledb": "^6.3.0"
}
```

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

## 🔐 **Authentication & Authorization**

### **Dual Authentication System**

#### **1. Primary Authentication (Central API)**
- **Endpoint**: `http://10.116.3.138:8888/api/web_check_login`
- **Flow**: Central API integration with automatic role mapping
- **Features**: Automatic department routing, position-based role assignment

#### **2. Admin Fallback Authentication**
- **Purpose**: System access during central API outages
- **Scope**: Admin accounts only during fallback mode
- **Security**: Bcrypt hashed passwords, environment variable storage

### **Environment Variables Required**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/uxone"

# Authentication
ADMIN_FALLBACK_USERNAME=admin
ADMIN_FALLBACK_PASSWORD=admin123
ADMIN_FALLBACK_ROLE=GENERAL DIRECTOR
ADMIN_FALLBACK_NAME=System Administrator
ADMIN_FALLBACK_EMAIL=admin@tipa.co.th
ADMIN_FALLBACK_DEPARTMENT=IT
ADMIN_FALLBACK_DEPARTMENT_NAME=Information Technology

# Central API
CENTRAL_API_URL=http://10.116.3.138:8888/api/web_check_login

# JDE Database Connection
JDE_DB_HOST=your-jde-server-ip
JDE_DB_PORT=1521
JDE_DB_SERVICE=JDE
JDE_DB_USER=your-jde-username
JDE_DB_PASSWORD=your-jde-password

# AI Service Configuration
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-env
```

## 🔗 **JDE 9.2 Integration**

### **Real Database Connection**
- **OracleDB Driver**: Direct connection to JDE EnterpriseOne 9.2
- **Performance**: 12x faster with caching implementation
- **Data Accuracy**: Proper transformations and formatting

### **Key JDE Tables**

#### **F4101 - Item Master**
```sql
SELECT 
  IMITM,    -- Item Number
  IMLITM,   -- Item Description
  IMTYP,    -- Item Type
  IMUM,     -- Unit of Measure
  IMLT,     -- Lead Time
  IMSSQ,    -- Safety Stock
  IMMOQ,    -- Minimum Order Quantity
  IMMXQ,    -- Maximum Order Quantity
  IMLOTS,   -- Lot Size
  IMCC,     -- Cost Center
  IMPL,     -- Planner
  IMBUY     -- Buyer
FROM F4101
```

#### **F4301 - Purchase Order Header**
```sql
SELECT 
  PDDOCO,   -- PO Number
  PDAN8,    -- Supplier ID
  PDALPH,   -- Supplier Name
  PDRQDC,   -- Order Date
  PDPDDJ,   -- Promise Date
  PDSTS,    -- Status
  PDTOA,    -- Total Amount
  PDCNDJ,   -- Currency
  PDBUY     -- Buyer
FROM F4301
```

#### **F4311 - Purchase Order Detail**
```sql
SELECT 
  PDDOCO,   -- PO Number
  PDLINE,   -- Line Number
  PDITM,    -- Item Number
  PDDSC1,   -- Description
  PDQTOR,   -- Quantity
  PDRQTOR,  -- Quantity Received
  PDUPRC,   -- Unit Price
  PDEXRC,   -- Extended Price
  PDPDDJ,   -- Promise Date
  PDSTS     -- Status
FROM F4311
```

### **Data Transformations**

#### **Currency Handling**
- **Base Currency (USD)**: Always divided by 100 for display
- **Foreign Currency (VND)**: No division, displayed as whole numbers
- **Unit Costs**: Foreign unit costs divided by 10,000
- **Extended Costs**: Foreign extended costs displayed without division

#### **Quantity Formatting**
- **All quantities divided by 100** (JDE internal format)
- **Non-decimal UOMs** (EA, PCS, BOX, etc.): Show whole numbers
- **Metric/Imperial UOMs** (KG, L, M, etc.): Show 2 decimal places
- **Locale-aware formatting** with proper number separators

#### **Date Conversions**
- **Julian Date Parsing**: JDE's internal date format (YYYYDDD) converted to ISO dates
- **Year Handling**: 
  - Years 100+ → Add 1900 (e.g., 124 → 2024)
  - Years 50-99 → Add 1900 (e.g., 50 → 1950)
  - Years 0-49 → Add 2000 (e.g., 24 → 2024)

#### **String Processing**
- **All string fields trimmed** of whitespace
- **Line numbers divided by 1,000** for display
- **Status codes mapped** to human-readable statuses

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

interface Demand {
  id: string;          // Custom ID (LR-YYYYMMDD-XXX)
  bu: string;
  department: string;
  account: number;
  approvalRoute: string | null;
  expenseAccount: number;
  expenseDescription: string;
  expenseGLClass: string;
  expenseStockType: string;
  expenseOrderType: string;
  justification: string;
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expectedDeliveryDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  userId: string;
  demandLines: DemandLine[];
}

interface DemandLine {
  id: string;
  demandId: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  unitOfMeasure: string;
  specifications: string;
  supplierPreference: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

### **ERP Data Transformation**
```typescript
// Local Demand → ERP JSON Format
interface ERPRequest {
  Supplier_code: string;
  Requested: string;           // MM/DD/YYYY format
  GridIn_1_3: ERPLineItem[];
  P4310_Version: string;
}

interface ERPLineItem {
  Item_Number: string;
  Quantity_Ordered: string;
  Tr_UoM: string;
  G_L_Offset: string;
  Cost_Center: string;
  Obj_Acct: string;
}
```

### **Key Features**
- **Multi-line Support**: Add/remove demand lines dynamically
- **Real-time Validation**: Zod schema validation with error handling
- **Cost Calculation**: Automatic total cost calculation
- **Department Integration**: BU/Department selector with account mapping
- **Expense Account Mapping**: Automatic GL class and account assignment
- **Approval Workflow**: Status tracking and notification system
- **ERP Integration**: Ready for external ERP system API calls

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

## 📊 **Core Features**

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

## 🗂️ **Database Schema**

### **Core Models**
- **User**: User accounts with roles and departments
- **Project**: Project management with approval states
- **Task**: Task management with dependencies
- **Ticket**: Helpdesk ticket system
- **Document**: File management with annotations
- **Notification**: Real-time notifications
- **Comment**: Communication system
- **DocumentTemplate**: Reusable templates
- **DocumentNumber**: Auto-generated document numbering

### **Demand Management Models**
- **Demand**: Main demand records with custom IDs
- **DemandLine**: Individual line items within demands
- **DemandSequence**: Auto-incrementing sequence tracking for custom IDs

### **JDE Models**
- **JDEPurchaseOrderHeader**: F4301 data with transformations
- **JDEPurchaseOrderDetail**: F4311 data with UOM information
- **JDEInventoryItem**: F4101/F4102 combined data
- **JDESupplier**: F0101 address book data

### **Key Relationships**
- Users belong to departments and have roles
- Projects have team members and documents
- Tasks can have dependencies and attachments
- Tickets are assigned to users and teams
- Documents can be annotated and versioned
- Demands have multiple demand lines
- JDE data is cached and synchronized locally

## 🚀 **Performance Optimizations**

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

## 📁 **Project Structure**

```
uxone/
├── app/                    # Next.js app directory
│   ├── (tipa)/            # TIPA-specific routes
│   │   ├── admin/         # Admin panel
│   │   └── lvm/           # Main application routes
│   │       ├── procurement/  # Procurement AI module
│   │       ├── inventory/    # Inventory management
│   │       ├── demands/      # Demand management system
│   │       │   ├── create/   # Demand creation forms
│   │       │   ├── [id]/     # Individual demand views
│   │       │   └── page.tsx  # Demands list page
│   │       └── purchase-orders/ # PO management
│   ├── api/               # API routes
│   │   ├── jde/           # JDE integration endpoints
│   │   ├── ai-agent/      # AI agent endpoints
│   │   ├── demands/       # Demand management endpoints
│   │   │   ├── route.ts   # Main demands API
│   │   │   ├── [id]/      # Individual demand endpoints
│   │   │   └── erp-integration/ # ERP integration
│   │   └── auth/          # Authentication endpoints
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── MultiLineDemandForm.tsx # Multi-line demand form
│   ├── ERPIntegrationTest.tsx  # ERP integration testing
│   └── Navbar/           # Navigation components
├── config/               # Application configuration
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── jde-connector.ts  # JDE database connector
│   ├── quantity-formatter.ts # Quantity formatting utilities
│   ├── demand-id-generator.ts # Custom demand ID generation
│   ├── erp-data-transformer.ts # ERP data transformation
│   └── auth.ts           # Authentication utilities
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🔧 **Configuration**

### **App Configuration (`config/app.ts`)**
The system uses a centralized configuration file that defines:
- Department codes and home pages
- Role hierarchy and permissions
- RBAC (Role-Based Access Control) rules
- UI settings and themes
- API endpoints and security settings

### **Key Configuration Areas**
1. **Department Mapping**: Maps user departments to system departments
2. **Role Permissions**: Defines what each role can access
3. **Feature Access**: Controls feature availability by role
4. **Page Access**: Restricts page access based on user role
5. **API Security**: Method-level API access control

## 🧪 **Testing & Quality Assurance**

### **JDE Integration Testing**
- **Connection Testing**: `/api/jde/test-oracle`
- **Inventory Testing**: `/api/jde/inventory`
- **Purchase Order Testing**: `/api/jde/purchase-orders`
- **Data Synchronization**: Real-time sync with local database

### **Demand Management Testing**
- **Form Validation**: Multi-line demand form testing
- **ID Generation**: Custom demand ID generation testing
- **ERP Integration**: Data transformation testing
- **Approval Workflow**: Status tracking and notification testing

### **API Testing**
- **Endpoint Validation**: All endpoints tested
- **Data Integrity**: Verify data transformations
- **Performance Testing**: Load testing for large datasets
- **Error Scenarios**: Test error handling

### **UI Testing**
- **Responsive Design**: Mobile and desktop testing
- **User Experience**: Intuitive navigation and interactions
- **Accessibility**: WCAG compliance
- **Cross-browser**: Multiple browser testing

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

## 🔒 **Security Features**

### **Security Measures**
- **Role-Based Access Control**: Granular permission system
- **API Security**: Method-level access control
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: React automatic escaping
- **CSRF Protection**: NextAuth.js built-in protection

### **Security Best Practices**
- Regular dependency updates
- Environment variable management
- Input sanitization
- Error message sanitization
- Secure file upload handling

## 📈 **Performance Considerations**

### **Optimization Strategies**
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Database Indexing**: Proper database indexes for queries
- **Caching**: React Query for API response caching
- **Lazy Loading**: Component and route lazy loading

### **Monitoring**
- **Error Tracking**: Implement error monitoring
- **Performance Metrics**: Track page load times
- **Database Performance**: Monitor query performance
- **User Analytics**: Track feature usage

## 🚀 **Deployment & Configuration**

### **Development Setup**
```bash
# Clone the repository
git clone <repository-url>
cd uxone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

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

### **✅ Completed**
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

### **🔄 In Progress**
- [ ] **User Creation Fix**: Resolving unique constraint violation for test users
- [ ] **AI Agent Development**: Phase 2 of procurement AI implementation
- [ ] **Real-time Synchronization**: Live data sync with JDE
- [ ] **Advanced Analytics**: Machine learning insights and forecasting

### **📋 Planned**
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

## 🐛 **Current Issues & Resolutions**

### **Issue: Unique Constraint Violation for Test Users**
- **Problem**: When creating test users during demand submission, username unique constraint fails
- **Root Cause**: Test user creation logic doesn't handle existing usernames
- **Status**: In progress - need to implement upsert logic or better user management
- **Impact**: Prevents demand creation for test accounts

### **Issue: Date Handling in Multi-Line Form**
- **Problem**: Type mismatch between form input (string) and Zod schema expectations
- **Resolution**: Implemented proper date string handling with ISO conversion
- **Status**: Resolved

### **Issue: Navigation to Demands Page**
- **Problem**: Menu link not working properly
- **Resolution**: Removed submenu complexity, implemented direct link
- **Status**: Resolved

### **Issue: Null Reference Errors in Demands List**
- **Problem**: Runtime errors when accessing undefined properties
- **Resolution**: Added comprehensive null checks and optional chaining
- **Status**: Resolved

---

## 📄 **Documentation References**

- **README.md**: Main project overview and setup
- **JDE_ORACLEDB_SETUP.md**: JDE database connection guide
- **JDE_TESTING_GUIDE.md**: Integration testing procedures
- **procurement_README.md**: Procurement AI agent documentation
- **JDE_F4301_COLUMN_MAPPING.md**: Purchase order header mapping
- **JDE_F4311_COLUMN_MAPPING.md**: Purchase order detail mapping
- **JDE_DATA_TRANSFORMATIONS.md**: Data transformation rules
- **INVENTORY_EXPORT_IMPLEMENTATION.md**: Export functionality
- **INVENTORY_CACHING_IMPLEMENTATION.md**: Caching system
- **QUANTITY_FORMATTING_IMPLEMENTATION.md**: Quantity formatting rules
- **PROCUREMENT_DEPARTMENT.md**: Procurement module documentation
- **ADMIN_FALLBACK_AUTH.md**: Authentication fallback system

---

**Last Updated**: January 2, 2025  
**Version**: 1.1.0  
**Maintainer**: Eric Nguyen  
**Organization**: TIPA (Thai Industrial Promotion Agency)  
**Status**: Production Ready with Active Development - Demand Management System Added 