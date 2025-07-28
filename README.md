# UXOne - Unified Project Management System

## 🏢 Project Overview

**UXOne** is a comprehensive enterprise project management system developed for TIPA (Thai Industrial Promotion Agency). It's a Next.js-based web application that provides unified project management, task tracking, helpdesk support, and team collaboration capabilities across multiple departments.

### 🎯 Core Purpose
- **Unified Management**: Single platform for project, task, and helpdesk management
- **Department-Specific Views**: Customized interfaces for different organizational departments
- **Role-Based Access Control**: Granular permissions based on organizational hierarchy
- **Document Management**: PDF handling, annotations, and template management
- **Real-time Collaboration**: Comments, notifications, and team coordination

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 15.3.3 with React 19, TypeScript
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with custom credential provider
- **Styling**: Tailwind CSS 4 with custom UI components
- **State Management**: TanStack Query (React Query)
- **PDF Processing**: PDF-lib, Fabric.js for annotations
- **Charts**: Recharts for analytics and reporting

### Key Dependencies
```json
{
  "next": "15.3.3",
  "react": "^19.0.0",
  "@prisma/client": "^4.16.2",
  "next-auth": "^5.0.0-beta.29",
  "@tanstack/react-query": "^5.80.10",
  "pdf-lib": "^1.17.1",
  "fabric": "^6.7.1",
  "recharts": "^2.15.3"
}
```

## 🏢 Organizational Structure

### Departments Supported
The system supports 15+ departments with specialized interfaces:

| Department | Code | Home Page | Description |
|------------|------|-----------|-------------|
| Information Systems | IS | `/lvm/helpdesk` | IT and helpdesk management |
| Quality Control | QC | `/lvm/quality-control` | Quality management |
| Quality Assurance | QA | `/lvm/quality-assurance` | Testing and QA |
| Human Resources | HR | `/lvm/human-resources` | HR management |
| Finance | FIN | `/lvm/finance` | Financial management |
| Logistics | LOG | `/lvm/logistics` | Supply chain |
| Procurement | PROC | `/lvm/procurement` | Purchasing |
| Production Planning | PC | `/lvm/production-planning` | Planning |
| Production Maintenance | PM | `/lvm/production-maintenance` | Equipment |
| Facility Management | FM | `/lvm/facility-management` | Infrastructure |
| Customer Service | CS | `/lvm/customer-service` | Support |
| Sales | SALES | `/lvm/sales` | Sales management |
| Operations | OPS | `/lvm/operations` | Operations management |
| Administration | ADMIN | `/lvm/admin` | Admin panel |

### Role Hierarchy (11 Levels)
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

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Central API Integration**: Primary authentication via TIPA's central API (`http://10.116.3.138:8888/api/web_check_login`)
2. **Fallback System**: Admin fallback credentials for system access
3. **Role Mapping**: Automatic mapping of central API positions to internal roles
4. **Department Routing**: Users are automatically redirected to their department home page

### Admin Override System
```typescript
const ADMIN_OVERRIDE_USERS = [
  'administrator', // Your username
  'admin',
  // Add more admin usernames as needed
];
```

### Environment Variables Required
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
```

## 📊 Core Features

### 1. Project Management
- **Project Creation & Tracking**: Full project lifecycle management
- **Document Management**: PDF upload, annotation, and version control
- **Approval Workflow**: Multi-level approval system
- **Team Assignment**: Project member management
- **Status Tracking**: Planning → Active → On Hold → Completed → Cancelled

### 2. Task Management
- **Task Creation**: Hierarchical task structure with dependencies
- **Assignment & Tracking**: Assign tasks to team members
- **Time Tracking**: Built-in time tracking capabilities
- **File Attachments**: Support for multiple file types
- **Comments & Collaboration**: Real-time communication

### 3. Helpdesk System
- **Ticket Management**: Complete helpdesk workflow
- **Category System**: Support, Bug Report, Feature Request, Technical Issue
- **Priority Levels**: Low, Medium, High, Urgent
- **SLA Tracking**: Response and resolution time monitoring
- **Assignment & Escalation**: Automatic routing and escalation

### 4. Document Management
- **PDF Processing**: Upload, view, and annotate PDFs
- **Template System**: Reusable document templates
- **Version Control**: Document versioning and history
- **Approval Workflow**: Document approval process
- **Public View**: Share documents with external stakeholders

### 5. Analytics & Reporting
- **Dashboard KPIs**: Real-time performance metrics
- **Project Analytics**: Project progress and health indicators
- **Team Performance**: Individual and team productivity metrics
- **Helpdesk Reports**: Ticket resolution and SLA compliance
- **Custom Charts**: Interactive data visualization

## 🗂️ Database Schema

### Core Models
- **User**: User accounts with roles and departments
- **Project**: Project management with approval states
- **Task**: Task management with dependencies
- **Ticket**: Helpdesk ticket system
- **Document**: File management with annotations
- **Notification**: Real-time notifications
- **Comment**: Communication system
- **DocumentTemplate**: Reusable templates
- **DocumentNumber**: Auto-generated document numbering

### Key Relationships
- Users belong to departments and have roles
- Projects have team members and documents
- Tasks can have dependencies and attachments
- Tickets are assigned to users and teams
- Documents can be annotated and versioned

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd uxone
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database (optional)
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Production Deployment
```bash
npm run build
npm start
```

## 🔧 Configuration

### App Configuration (`config/app.ts`)
The system uses a centralized configuration file that defines:
- Department codes and home pages
- Role hierarchy and permissions
- RBAC (Role-Based Access Control) rules
- UI settings and themes
- API endpoints and security settings

### Key Configuration Areas
1. **Department Mapping**: Maps user departments to system departments
2. **Role Permissions**: Defines what each role can access
3. **Feature Access**: Controls feature availability by role
4. **Page Access**: Restricts page access based on user role
5. **API Security**: Method-level API access control

## 📁 Project Structure

```
uxone/
├── app/                    # Next.js app directory
│   ├── (tipa)/            # TIPA-specific routes
│   │   ├── admin/         # Admin panel
│   │   └── lvm/           # Main application routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── Navbar/           # Navigation components
├── config/               # Application configuration
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🔄 Development Workflow

### Code Organization
- **Components**: Reusable UI components in `/components`
- **Pages**: Route-specific components in `/app`
- **API Routes**: Backend logic in `/app/api`
- **Hooks**: Custom React hooks in `/hooks`
- **Types**: TypeScript definitions in `/types`

### Key Development Patterns
1. **Role-Based Components**: Components check user permissions
2. **Department Routing**: Users are routed to department-specific pages
3. **API Security**: All API routes validate user permissions
4. **Error Handling**: Comprehensive error handling throughout
5. **Type Safety**: Full TypeScript coverage

## 🛠️ Common Development Tasks

### Adding a New Department
1. Update `config/app.ts` with department configuration
2. Add department home page route
3. Update role permissions if needed
4. Test department-specific functionality

### Adding a New Role
1. Define role in `config/app.ts`
2. Set appropriate permission level
3. Update RBAC configuration
4. Test role-based access

### Creating New API Endpoints
1. Create route in `/app/api`
2. Implement permission checking
3. Add proper error handling
4. Update TypeScript types

## 🔍 Troubleshooting

### Common Issues
1. **Authentication Failures**: Check central API connectivity
2. **Database Connection**: Verify PostgreSQL connection string
3. **Permission Errors**: Check user role and department mapping
4. **PDF Processing**: Ensure file upload permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📈 Performance Considerations

### Optimization Strategies
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Database Indexing**: Proper database indexes for queries
- **Caching**: React Query for API response caching
- **Lazy Loading**: Component and route lazy loading

### Monitoring
- **Error Tracking**: Implement error monitoring
- **Performance Metrics**: Track page load times
- **Database Performance**: Monitor query performance
- **User Analytics**: Track feature usage

## 🔒 Security Features

### Security Measures
- **Role-Based Access Control**: Granular permission system
- **API Security**: Method-level access control
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: React automatic escaping
- **CSRF Protection**: NextAuth.js built-in protection

### Security Best Practices
- Regular dependency updates
- Environment variable management
- Input sanitization
- Error message sanitization
- Secure file upload handling

## 📞 Support & Maintenance

### System Administration
- **User Management**: Add/remove users and assign roles
- **Department Configuration**: Update department settings
- **Role Management**: Modify role permissions
- **System Monitoring**: Monitor system health and performance

### Backup & Recovery
- **Database Backups**: Regular PostgreSQL backups
- **File Backups**: Document and upload backups
- **Configuration Backups**: Environment and config backups
- **Disaster Recovery**: Document recovery procedures

## 🚀 Future Enhancements

### Planned Features
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Machine learning insights
- **Integration APIs**: Third-party system integration
- **Workflow Automation**: Automated approval workflows
- **Advanced Reporting**: Custom report builder

### Technical Improvements
- **Microservices**: Service-oriented architecture
- **Real-time Features**: WebSocket integration
- **Advanced Search**: Full-text search capabilities
- **API Documentation**: OpenAPI/Swagger documentation
- **Testing**: Comprehensive test coverage

---

## 📝 Notes for Second Machine Setup

When transferring to your second machine:

1. **Clone the repository** and ensure you have the latest code
2. **Set up environment variables** with the same configuration
3. **Install dependencies** and generate Prisma client
4. **Run database migrations** to ensure schema is up to date
5. **Test authentication** with your admin credentials
6. **Verify department routing** works correctly
7. **Check all major features** are functioning properly

The system is designed to be portable and should work identically on both machines with proper configuration.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Eric Nguyen  
**Organization**: TIPA (Thai Industrial Promotion Agency)
