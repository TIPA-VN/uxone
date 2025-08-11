# UXOne - Unified Experience Platform

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Department System](#department-system)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Components](#components)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🚀 Overview

UXOne is a modern enterprise platform designed to provide a unified user experience across multiple departments and business units. The platform integrates various business processes including project management, helpdesk support, procurement, quality control, and more.

### Key Benefits
- **Unified Interface**: Single platform for multiple business functions
- **Department-Specific Dashboards**: Tailored experiences for different user groups
- **Role-Based Access Control**: Secure access management
- **Real-time Notifications**: Server-Sent Events for live updates
- **Responsive Design**: Modern UI built with Tailwind CSS and Shadcn UI

## ✨ Features

### Core Functionality
- **Project Management**: Create, track, and manage projects with team collaboration
- **Helpdesk System**: Department-specific ticket management and support
- **Task Management**: Assign, track, and manage tasks with dependencies
- **Document Management**: Upload, version, and manage documents
- **Procurement**: Purchase order management and inventory tracking
- **Quality Control**: Quality assurance workflows and processes
- **User Management**: Role-based access control and user administration

### Advanced Features
- **Real-time Notifications**: Live updates using Server-Sent Events
- **Department Mapping**: Legacy system integration with modern department codes
- **Audit Logging**: Comprehensive tracking of all system changes
- **API Integration**: External system connectivity and webhooks
- **Search & Filtering**: Advanced data filtering and search capabilities
- **Mobile Responsive**: Optimized for all device types

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15.3.3, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI Components
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with Prisma migrations
- **Authentication**: NextAuth.js with custom credentials provider
- **State Management**: React Hooks, Context API
- **Real-time**: Server-Sent Events (SSE)

### Project Structure
```
uxone/
├── app/                    # Next.js app directory
│   ├── (tipa)/           # Protected route group
│   │   ├── lvm/          # Main application routes
│   │   │   ├── admin/    # Administrative functions
│   │   │   ├── helpdesk/ # Helpdesk system
│   │   │   ├── projects/ # Project management
│   │   │   ├── tasks/    # Task management
│   │   │   └── ...       # Other modules
│   │   └── ...
│   ├── api/              # API endpoints
│   └── auth/             # Authentication routes
├── components/            # Reusable UI components
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
├── config/               # Application configuration
└── types/                # TypeScript type definitions
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uxone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npx prisma migrate dev
   
   # Seed initial data
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uxone"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Central API (optional)
CENTRAL_API_URL="http://your-api-url"

# Admin Fallback
ADMIN_FALLBACK_HASHED_PASSWORD="hashed-password"
```

## 🏢 Department System

### Department Categories
The application supports four main department categories:

1. **Core Departments**
   - Information Systems (IS)
   - Human Resources (HR)
   - Finance (FIN)
   - Administration (ADMIN)

2. **Production Departments**
   - Manufacturing (MFG)
   - Production Engineering (DES)
   - Quality Assurance (QA)
   - Logistics (LOG)

3. **Support Departments**
   - Customer Service (CS)
   - Helpdesk (HD)
   - Maintenance (MAINT)
   - Security (SEC)

4. **Manufacturing Departments**
   - Manufacturing Engineering (ME)
   - Product Engineering (DES)
   - Assembly (ASSY)
   - Testing (TEST)

### Department Mapping
The system includes comprehensive mapping from legacy department names to modern UXOne codes:

```typescript
export interface DepartmentMapping {
  legacyName: string;
  uxoneCode: string;
  category: 'core' | 'production' | 'support' | 'manufacturing';
  description: string;
  isActive: boolean;
  homePage?: string;
  aliases?: string[];
}
```

### Home Page Routing
Each department has a designated home page:
- **IS**: `/lvm/admin` (Administrative access)
- **PROC**: `/lvm/procurement` (Procurement dashboard)
- **CS**: `/lvm/customer-service` (Customer service dashboard)
- **QA**: `/lvm/quality-control` (Quality control dashboard)

## 🔐 Authentication & Authorization

### Authentication Methods
1. **Central API Integration**: Primary authentication via external system
2. **Local Admin Accounts**: Fallback authentication for administrators
3. **Test Accounts**: Development and testing accounts

### User Roles
- **ADMIN**: Full system access
- **GENERAL_DIRECTOR**: Executive level access
- **GENERAL_MANAGER**: Senior management access
- **ASSISTANT_GENERAL_MANAGER**: Assistant management access
- **SENIOR_MANAGER**: Department management access
- **MANAGER**: Team management access
- **STAFF**: Basic user access

### Access Control
- **Route Protection**: Middleware-based route protection
- **Role-Based Access**: Functionality based on user role
- **Department-Based Access**: Data access based on user department
- **Admin Override**: Special access for administrative users

## 🌐 API Endpoints

### Core APIs
- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Projects**: `/api/projects/*`
- **Tasks**: `/api/tasks/*`
- **Tickets**: `/api/tickets/*`
- **Documents**: `/api/documents/*`

### Administrative APIs
- **User Management**: `/api/admin/users`
- **Project Management**: `/api/admin/projects`
- **System Settings**: `/api/admin/settings`
- **RBAC Management**: `/api/admin/rbac`

### Integration APIs
- **Notifications**: `/api/notifications/*`
- **Webhooks**: `/api/service/webhooks/*`
- **External Sync**: `/api/integration/*`

### API Features
- **Department Filtering**: Automatic data filtering by user department
- **Real-time Updates**: SSE endpoints for live data
- **Audit Logging**: Automatic tracking of all changes
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: Built-in request throttling

## 🗄️ Database Schema

### Core Models

#### User Model
```prisma
model User {
  id                 String    @id @default(cuid())
  username          String    @unique
  name              String?
  email             String?   @unique
  department        String?   // UXOne department code
  centralDepartment String?   // Legacy department name
  departmentName    String?   // Display name
  role              String?
  isActive          Boolean   @default(true)
  emp_code          String?   @unique
  // ... relationships and audit fields
}
```

#### Project Model
```prisma
model Project {
  id                String    @id @default(cuid())
  title             String
  description       String?
  status            ProjectStatus
  priority          ProjectPriority
  startDate         DateTime?
  dueDate           DateTime?
  createdById       String
  // ... relationships and audit fields
}
```

#### Ticket Model
```prisma
model Ticket {
  id                String    @id @default(cuid())
  ticketNumber      String    @unique
  title             String
  description       String
  status            TicketStatus
  priority          TicketPriority
  category          TicketCategory
  createdById       String
  assignedToId      String?
  // ... relationships and audit fields
}
```

### Audit System
All models include audit fields:
- `lastUpdatedBy`: User who last modified the record
- `lastUpdatedById`: ID of the user who last modified
- `createdAt`: Record creation timestamp
- `updatedAt`: Last modification timestamp

## 🧩 Components

### Core Components
- **AdminNavigation**: Administrative sidebar navigation
- **DataTable**: Reusable data table with sorting and filtering
- **StatusBadge**: Status indicators for various entities
- **PriorityBadge**: Priority level indicators
- **AuditInfo**: Audit information display

### UI Components
Built with Shadcn UI:
- **Cards**: Information containers
- **Buttons**: Action buttons with variants
- **Forms**: Form inputs and validation
- **Modals**: Dialog and modal components
- **Tables**: Data display tables
- **Badges**: Status and category indicators

### Custom Hooks
- **useNotifications**: Real-time notification management
- **useActivities**: Activity tracking and logging
- **useBacklogHooks**: Backlog management utilities
- **useClickOutside**: Click outside detection

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Configuration
- Set production environment variables
- Configure database connection
- Set up external API endpoints
- Configure authentication secrets

### Performance Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js built-in image optimization
- **Caching**: Strategic caching for API responses
- **Compression**: Gzip compression for text-based resources

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Errors
**Problem**: Users unable to log in
**Solution**: 
- Check environment variables
- Verify database connectivity
- Check central API availability

#### 2. Department Access Issues
**Problem**: Users seeing wrong department data
**Solution**:
- Verify user department assignment
- Check department mapping configuration
- Review middleware access controls

#### 3. API Errors
**Problem**: 500 Internal Server Errors
**Solution**:
- Check server logs for detailed errors
- Verify database schema consistency
- Check API endpoint configurations

#### 4. Build Errors
**Problem**: Compilation failures
**Solution**:
- Clear build cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: `npm run type-check`

### Debug Features
The application includes extensive debugging:
- **Console Logging**: Detailed API call logging
- **Error Boundaries**: Graceful error handling
- **Debug Endpoints**: Development-only debugging APIs
- **Audit Trails**: Complete change tracking

### Performance Monitoring
- **Build Metrics**: Bundle size analysis
- **API Response Times**: Performance tracking
- **Database Queries**: Query optimization insights
- **User Experience**: Loading state management

## 📚 Additional Resources

### Documentation
- **API Documentation**: Comprehensive API reference
- **Component Library**: UI component documentation
- **Database Schema**: Complete database documentation
- **Deployment Guide**: Production deployment instructions

### Development
- **Contributing Guidelines**: Development contribution rules
- **Code Standards**: Coding conventions and standards
- **Testing Strategy**: Testing approach and tools
- **Release Process**: Version management and releases

### Support
- **Issue Tracking**: GitHub issues for bug reports
- **Feature Requests**: Enhancement proposal system
- **Community**: Developer community and discussions
- **Updates**: Regular platform updates and improvements

---

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Development Team**: UXOne Development Team
- **Architecture**: Enterprise Solutions Architecture
- **Design**: User Experience Design Team
- **Quality Assurance**: QA and Testing Team

---

*Last Updated: January 2025*
*Version: 1.0.0*
