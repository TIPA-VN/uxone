# UXOne - Enterprise Management System

A comprehensive enterprise management system built with Next.js, featuring authentication, JDE integration, demand management, AI agents, and cross-system integration with TIPA Mobile.

## 🏗️ Architecture Overview

### System Components
- **UXOne Web Application**: Next.js-based enterprise management system
- **TIPA Mobile**: Mobile application with cross-system integration
- **Central Authentication API**: External authentication service
- **JD Edwards Integration**: Direct ERP system connection
- **PostgreSQL Database**: Shared database for both UXOne and TIPA Mobile

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with snake_case naming convention
- **Authentication**: NextAuth.js with central API integration
- **AI Integration**: Webhook-based AI agents for procurement and customer service

## 🚀 Features

### Core Modules
- **Authentication & Authorization**: Central API integration with role-based access
- **User Management**: Employee data synchronization across systems
- **Department Management**: Multi-department support with role mapping
- **Notification System**: Real-time notifications with cross-system sync
- **Project Management**: Full project lifecycle management
- **Task Management**: Comprehensive task tracking and assignment
- **Document Management**: File upload, versioning, and template system

### Advanced Features
- **JDE Integration**: Direct connection to JD Edwards EnterpriseOne 9.2
- **Demand Management**: Multi-line demand creation with ERP integration
- **AI Agents**: 
  - Procurement AI Agent for demand forecasting and optimization
  - Customer Service AI Agent for support automation
- **Service API**: RESTful APIs for external system integration
- **Webhook System**: Event-driven architecture for real-time updates

### Cross-System Integration
- **TIPA Mobile Integration**: Seamless data synchronization
- **Notification Sync**: Bidirectional notification management
- **User Sync**: Automatic user data synchronization
- **Service Authentication**: Bearer token-based service API access

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Access to JD Edwards EnterpriseOne 9.2
- Central Authentication API access

## 🛠️ Installation & Setup

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

## 🔐 Authentication System

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

## 🗄️ Database Schema

### Key Models
- **User**: Employee information with `emp_code` and role mapping
- **Notification**: Cross-system notification management
- **Project**: Project lifecycle management
- **Task**: Task tracking and assignment
- **Demand**: Procurement demand management
- **Document**: File management and templates
- **ServiceApp**: External service registration

### Database Naming Convention
- Uses snake_case for all database fields
- `emp_code` field for employee identification
- Consistent naming across UXOne and TIPA Mobile

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/session` - Session validation

### Service APIs (External Access)
- `GET /api/service/health` - System health check
- `GET /api/service/notifications` - Notification retrieval
- `POST /api/service/notifications` - Notification creation

### Integration APIs
- `GET /api/integration/notifications` - Cross-system notifications
- `POST /api/integration/sync-user` - User synchronization
- `PATCH /api/integration/notifications` - Notification updates

### Internal APIs
- `GET /api/notifications` - UXOne notifications
- `POST /api/projects` - Project management
- `GET /api/demands` - Demand management
- `POST /api/documents` - Document management

## 🔄 Cross-System Integration

### TIPA Mobile Integration
- **Shared Database**: Both systems use the same PostgreSQL database
- **User Synchronization**: Automatic user data sync
- **Notification Sync**: Bidirectional notification management
- **Service Authentication**: Bearer token-based API access

### Integration Features
- Real-time data synchronization
- Event-driven webhook system
- Service API with authentication
- Health monitoring and logging

## 🤖 AI Integration

### Procurement AI Agent
- Demand forecasting and analysis
- Inventory optimization
- Purchase recommendations
- Risk assessment

### Customer Service AI Agent
- Automated support responses
- Ticket classification
- Knowledge base integration
- Customer interaction analysis

## 📱 TIPA Mobile Integration Guide

### Service Registration
1. Register TIPA Mobile as a ServiceApp in UXOne
2. Generate unique service key (Bearer token)
3. Configure permissions and access levels

### API Usage
```javascript
// Example: Fetch notifications from UXOne
const response = await fetch('http://localhost:3000/api/service/notifications', {
  headers: {
    'Authorization': 'Bearer YOUR_SERVICE_KEY',
    'Content-Type': 'application/json'
  }
});
```

### Data Synchronization
- User data automatically syncs between systems
- Notifications are synchronized bidirectionally
- Real-time updates via webhook system

## 🚀 Deployment

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

## 🧪 Testing

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
- Test TIPA Mobile integration
- Verify notification synchronization
- Test JDE data retrieval
- Validate AI agent responses

## 📊 Monitoring & Logging

### Health Monitoring
- Database connection status
- Service API availability
- Memory usage monitoring
- Response time tracking

### Logging
- Authentication attempts
- API request/response logging
- Error tracking and reporting
- Performance metrics

## 🔧 Development Workflow

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
- Check the documentation
- Review the health endpoint
- Contact the development team

---

**UXOne** - Enterprise Management System v1.0.0 