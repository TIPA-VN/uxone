# UXOne - Enterprise Management System

A comprehensive Next.js 15+ enterprise management system designed for manufacturing, procurement, and project management operations.

## 🚀 Features

### Core Modules
- **Project Management** - Full lifecycle project tracking with contract integration
- **Contract Management** - Comprehensive contract creation, approval, and finalization
- **Document Management** - Rich text editing, version control, and multi-format export
- **Demand Management** - Procurement demand tracking and approval workflows
- **Task Management** - Project task assignment, dependencies, and time tracking
- **Helpdesk System** - Ticket management with escalation and reporting
- **User Management** - Role-based access control (RBAC) and department management
- **Audit & Compliance** - Complete audit trails and document finalization

### Contract System Features
- **Rich Text Editor** - Quill.js based content creation with Vietnamese language support
- **Multi-Format Export** - PDF, HTML, TXT, MD, JSON formats
- **Approval Workflows** - Multi-level approval system with digital signatures
- **Date Management** - Start, effective, expiration, and end date tracking
- **Audit Reports** - Professional print layouts with complete contract history

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15.3.3 with App Router
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL with Prisma migrations
- **Authentication**: NextAuth.js with role-based access control
- **PDF Generation**: Puppeteer for HTML-to-PDF conversion
- **Rich Text**: Quill.js editor with custom font support
- **Styling**: Tailwind CSS with shadcn/ui components

### Project Structure
```
uxone/
├── app/                          # Next.js App Router
│   ├── (tipa)/                  # Main application routes
│   │   └── lvm/                 # LVM business unit
│   │       ├── projects/        # Project management
│   │       ├── contracts/       # Contract management (integrated)
│   │       ├── demands/         # Procurement demands
│   │       ├── tasks/           # Task management
│   │       ├── helpdesk/        # Helpdesk system
│   │       └── admin/           # Administrative functions
│   ├── api/                     # API endpoints
│   └── auth/                    # Authentication pages
├── components/                   # Reusable UI components
│   ├── contracts/               # Contract-specific components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   └── [module]/                # Module-specific components
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication utilities
│   ├── prisma.ts                # Database connection
│   ├── puppeteer-generator.ts   # PDF generation
│   └── logging/                 # Logging system
├── prisma/                      # Database schema and migrations
├── hooks/                       # Custom React hooks
└── types/                       # TypeScript type definitions
```

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd uxone
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Database setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uxone"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:8090"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Schema
The application uses Prisma ORM with the following key models:

- **Project** - Core project entity with contract integration
- **ContractDetails** - Contract metadata and approval workflows
- **Document** - Rich text content with version control
- **User** - User accounts with role-based permissions
- **Department** - Organizational structure
- **Task** - Project task management
- **Demand** - Procurement demand tracking

## 📖 Usage Guide

### Creating a Contract

1. **Navigate to Projects**
   ```
   /lvm/projects
   ```

2. **Create New Project**
   - Click "Create New Project"
   - Select "CONTRACT" as project type
   - Fill in basic project details

3. **Configure Contract**
   - Go to Contract tab
   - Click "Edit" button
   - Set contract details:
     - Contract Type (Purchase, Service, etc.)
     - Counterparty
     - Contract Value & Currency
     - **Start Date** - Contract commencement
     - **Effective Date** - Legal effectiveness
     - **Expiration Date** - Contract expiry
     - **End Date** - Alternative end date
     - Contract Status

4. **Add Content**
   - Switch to Document tab
   - Use rich text editor for contract content
   - Support for Vietnamese characters with Noto Sans font

5. **Save & Approve**
   - Save contract details
   - Submit for approval workflow
   - Track approval progress

### Contract Workflow

1. **Draft** → Initial contract creation
2. **Review** → Submitted for stakeholder review
3. **Approved** → Contract approved by all parties
4. **Signed** → Contract legally executed
5. **Executing** → Contract in active performance
6. **Completed** → Contract fulfilled

### Downloading Contracts

- **PDF Format** - Professional layout with audit information
- **HTML Format** - Web-viewable version
- **Plain Text** - Simple text extraction
- **Markdown** - Structured text format
- **JSON** - Complete metadata and content

## 🔐 Authentication & Authorization

### User Roles
- **USER** - Basic access to assigned projects
- **MANAGER** - Department-level management
- **SENIOR_MANAGER** - Cross-department oversight
- **GENERAL_MANAGER** - Business unit management
- **ADMIN** - Full system access

### Permission System
- **Project-based permissions** - Users can only access assigned projects
- **Department restrictions** - Access limited to user's department
- **Owner privileges** - Project creators have full control
- **Approval workflows** - Role-based approval requirements

## 📊 API Endpoints

### Core Endpoints
- `POST /api/projects` - Create new project
- `PATCH /api/projects/[id]/contract` - Update contract details
- `GET /api/contracts/[id]/finalized/download` - Download finalized contract
- `POST /api/demands` - Create procurement demand
- `GET /api/tasks` - Retrieve project tasks

### Contract Endpoints
- `PATCH /api/contracts/[id]/approve` - Approve contract
- `POST /api/contracts/[id]/finalized` - Finalize contract
- `GET /api/contracts/[id]/workflow` - Get approval workflow

## 🎨 UI Components

### Design System
- **shadcn/ui** - Base component library
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Consistent iconography
- **Responsive Design** - Mobile-first approach

### Key Components
- **ContractTab** - Contract details editing
- **EnhancedContractTab** - Main contract interface
- **DocumentEditor** - Rich text content creation
- **WorkflowProgressBar** - Approval status visualization
- **AuditInfo** - Contract audit information display

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Development Testing
```bash
# Type checking
npm run tsc

# Linting
npm run lint

# Build testing
npm run build
```

### API Testing
- Use the built-in API routes for testing
- Test endpoints with tools like Postman or Insomnia
- Monitor console logs for debugging information

## 📝 Development Notes

### Key Features
- **Vietnamese Language Support** - Full Unicode support with proper font handling
- **PDF Generation** - Puppeteer-based HTML-to-PDF with professional layouts
- **Real-time Updates** - WebSocket integration for live notifications
- **Audit Trails** - Complete change tracking and compliance reporting

### Performance Optimizations
- **Server Components** - Reduced client-side JavaScript
- **Dynamic Imports** - Code splitting for better performance
- **Database Indexing** - Optimized queries with Prisma
- **Caching** - Strategic caching for frequently accessed data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**UXOne** - Streamlining enterprise operations through intelligent contract and project management.
