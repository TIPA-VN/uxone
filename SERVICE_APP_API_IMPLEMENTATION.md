# Service App API Implementation Guide

## 🎯 **Project Overview**

This document outlines the implementation plan for creating API routes that allow external service applications to perform CRUD operations on Tasks, Notifications, and Approvals within the UXOne system.

### **Objectives**
- Enable microservice communication with UXOne
- Provide secure, rate-limited API access
- Maintain data integrity and audit trails
- Support real-time notifications and approvals
- Enable seamless integration with external systems

---

## 🏗️ **Architecture Overview**

### **System Components**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Service App   │    │   UXOne API     │    │   UXOne DB      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Auth Token  │◄┼────┼►│ Middleware  │ │    │ │ PostgreSQL  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ API Client  │◄┼────┼►│ Rate Limit  │ │    │ │ Redis Cache │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Webhooks    │◄┼────┼►│ SSE Stream  │ │    │ │ Audit Logs  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**
1. **Authentication**: Service app authenticates with API key
2. **Authorization**: Middleware validates permissions and rate limits
3. **Processing**: API routes handle CRUD operations
4. **Response**: JSON responses with appropriate status codes
5. **Notifications**: Real-time updates via SSE or webhooks

---

## 📋 **Implementation Phases**

### **Phase 1: Foundation & Authentication** ⭐ **START HERE**
**Duration**: 2-3 days
**Priority**: Critical

#### **1.1 Database Schema Extensions**
```sql
-- Create service app registration table
CREATE TABLE service_apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  service_key TEXT UNIQUE NOT NULL,
  permissions TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create service task extension table
CREATE TABLE service_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT UNIQUE REFERENCES tasks(id),
  service_id TEXT REFERENCES service_apps(id),
  service_type TEXT NOT NULL,
  external_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create service notification extension table
CREATE TABLE service_notifications (
  id TEXT PRIMARY KEY,
  notification_id TEXT UNIQUE REFERENCES notifications(id),
  service_id TEXT REFERENCES service_apps(id),
  service_type TEXT,
  priority TEXT DEFAULT 'medium',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create service approval table
CREATE TABLE service_approvals (
  id TEXT PRIMARY KEY,
  service_id TEXT REFERENCES service_apps(id),
  request_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  approver_id TEXT REFERENCES users(id),
  requester_id TEXT REFERENCES users(id),
  department TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM',
  due_date TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  comments TEXT,
  approval_level INTEGER DEFAULT 1,
  requires_multiple_approvers BOOLEAN DEFAULT false,
  approval_chain JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.2 Service Authentication System**
**File**: `app/api/service/auth/login/route.ts`
```typescript
// Implementation steps:
// 1. Create service app registration endpoint
// 2. Implement JWT token generation for services
// 3. Add rate limiting middleware
// 4. Create service validation middleware
```

**File**: `app/api/service/middleware.ts`
```typescript
// Implementation steps:
// 1. Service token validation
// 2. Permission checking
// 3. Rate limiting
// 4. Request logging
```

#### **1.3 Testing Phase 1**
```bash
# Test service registration
curl -X POST http://localhost:3000/api/service/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Service",
    "permissions": ["tasks:read", "tasks:create", "notifications:read"]
  }'

# Test service authentication
curl -X POST http://localhost:3000/api/service/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "serviceKey": "your-service-key"
  }'
```

---

### **Phase 2: Tasks API Implementation**
**Duration**: 3-4 days
**Priority**: High

#### **2.1 Tasks API Routes**
**File**: `app/api/service/tasks/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/tasks - List tasks with service filtering
// 2. POST /api/service/tasks - Create task with service metadata
// 3. PATCH /api/service/tasks/bulk - Bulk operations
// 4. DELETE /api/service/tasks - Bulk deletion
```

**File**: `app/api/service/tasks/[id]/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/tasks/[id] - Get single task
// 2. PATCH /api/service/tasks/[id] - Update task
// 3. DELETE /api/service/tasks/[id] - Delete task
```

**File**: `app/api/service/tasks/[id]/comments/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/tasks/[id]/comments - List comments
// 2. POST /api/service/tasks/[id]/comments - Add comment
```

**File**: `app/api/service/tasks/[id]/attachments/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/tasks/[id]/attachments - List attachments
// 2. POST /api/service/tasks/[id]/attachments - Upload attachment
// 3. DELETE /api/service/tasks/[id]/attachments/[attachmentId] - Delete attachment
```

#### **2.2 Testing Phase 2**
```bash
# Test task creation
curl -X POST http://localhost:3000/api/service/tasks \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Service Task",
    "description": "Created by service app",
    "assigneeId": "user-id",
    "serviceType": "external-system",
    "externalReference": "EXT-001"
  }'

# Test task listing
curl -X GET "http://localhost:3000/api/service/tasks?serviceType=external-system" \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN"

# Test task update
curl -X PATCH http://localhost:3000/api/service/tasks/task-id \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

---

### **Phase 3: Notifications API Implementation**
**Duration**: 2-3 days
**Priority**: High

#### **3.1 Notifications API Routes**
**File**: `app/api/service/notifications/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/notifications - List notifications
// 2. POST /api/service/notifications - Create notification
// 3. PATCH /api/service/notifications/bulk - Bulk operations
```

**File**: `app/api/service/notifications/[id]/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/notifications/[id] - Get notification
// 2. PATCH /api/service/notifications/[id] - Update notification
// 3. DELETE /api/service/notifications/[id] - Delete notification
```

**File**: `app/api/service/notifications/broadcast/route.ts`
```typescript
// Implementation steps:
// 1. POST /api/service/notifications/broadcast - Broadcast to all users
// 2. Rate limiting for broadcast operations
// 3. Permission validation for broadcast
```

**File**: `app/api/service/notifications/stream/route.ts`
```typescript
// Implementation steps:
// 1. SSE stream for real-time notifications
// 2. Service-specific filtering
// 3. Connection management
```

#### **3.2 Testing Phase 3**
```bash
# Test notification creation
curl -X POST http://localhost:3000/api/service/notifications \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "title": "Service Notification",
    "message": "This is a test notification",
    "type": "info",
    "serviceType": "external-system"
  }'

# Test broadcast notification
curl -X POST http://localhost:3000/api/service/notifications/broadcast \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "message": "Scheduled maintenance in 30 minutes",
    "type": "warning"
  }'

# Test SSE stream
curl -N http://localhost:3000/api/service/notifications/stream \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN"
```

---

### **Phase 4: Approvals API Implementation**
**Duration**: 4-5 days
**Priority**: Medium

#### **4.1 Approvals API Routes**
**File**: `app/api/service/approvals/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/approvals - List approvals
// 2. POST /api/service/approvals - Create approval request
// 3. GET /api/service/approvals/statistics - Get statistics
```

**File**: `app/api/service/approvals/[id]/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/approvals/[id] - Get approval details
// 2. PATCH /api/service/approvals/[id] - Update approval
// 3. DELETE /api/service/approvals/[id] - Cancel approval
```

**File**: `app/api/service/approvals/[id]/approve/route.ts`
```typescript
// Implementation steps:
// 1. POST /api/service/approvals/[id]/approve - Approve request
// 2. Multi-level approval chain handling
// 3. Notification triggers
```

**File**: `app/api/service/approvals/[id]/reject/route.ts`
```typescript
// Implementation steps:
// 1. POST /api/service/approvals/[id]/reject - Reject request
// 2. Rejection reason handling
// 3. Notification triggers
```

**File**: `app/api/service/approvals/pending/route.ts`
```typescript
// Implementation steps:
// 1. GET /api/service/approvals/pending - Get pending approvals
// 2. Filter by approver, department, priority
// 3. Pagination support
```

#### **4.2 Testing Phase 4**
```bash
# Test approval creation
curl -X POST http://localhost:3000/api/service/approvals \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-001",
    "requestType": "TASK",
    "requesterId": "user-id",
    "department": "IT",
    "priority": "HIGH",
    "serviceType": "external-system",
    "approvalLevel": 2
  }'

# Test approval action
curl -X POST http://localhost:3000/api/service/approvals/approval-id/approve \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Approved after review"
  }'

# Test pending approvals
curl -X GET "http://localhost:3000/api/service/approvals/pending?department=IT" \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN"
```

---

### **Phase 5: Integration & Webhooks**
**Duration**: 2-3 days
**Priority**: Medium

#### **5.1 Webhook System**
**File**: `app/api/service/webhooks/route.ts`
```typescript
// Implementation steps:
// 1. Webhook registration and management
// 2. Event delivery system
// 3. Retry mechanism
// 4. Webhook security
```

#### **5.2 Testing Phase 5**
```bash
# Test webhook registration
curl -X POST http://localhost:3000/api/service/webhooks \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-service.com/webhook",
    "events": ["task.created", "notification.sent", "approval.updated"],
    "secret": "webhook-secret"
  }'
```

---

### **Phase 6: Documentation & SDK**
**Duration**: 2-3 days
**Priority**: Low

#### **6.1 API Documentation**
- OpenAPI/Swagger specification
- Postman collection
- Code examples in multiple languages

#### **6.2 SDK Generation**
- TypeScript/JavaScript SDK
- Python SDK
- Java SDK
- .NET SDK

---

## 🧪 **Testing Strategy**

### **Unit Testing**
```bash
# Run unit tests
npm run test:unit

# Test coverage
npm run test:coverage
```

### **Integration Testing**
```bash
# Run integration tests
npm run test:integration

# Test with real database
npm run test:e2e
```

### **Load Testing**
```bash
# Test rate limiting
npm run test:load

# Test concurrent requests
npm run test:stress
```

### **Security Testing**
```bash
# Test authentication
npm run test:security

# Test authorization
npm run test:auth
```

---

## 🔧 **Development Environment Setup**

### **Prerequisites**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Service App Configuration
SERVICE_APP_SECRET=your-service-app-secret
SERVICE_APP_JWT_SECRET=your-jwt-secret
SERVICE_APP_RATE_LIMIT=100

# Redis Configuration (for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_TIMEOUT=5000
WEBHOOK_RETRY_ATTEMPTS=3
```

### **Database Setup**
```bash
# Create service app tables
npx prisma migrate dev --name add_service_app_tables

# Seed test data
npx prisma db seed

# Reset database (development only)
npx prisma migrate reset
```

---

## 📊 **Monitoring & Analytics**

### **Metrics to Track**
- API request volume by service
- Response times and error rates
- Rate limit violations
- Authentication failures
- Webhook delivery success rates

### **Logging Strategy**
```typescript
// Structured logging for service requests
interface ServiceLog {
  timestamp: string;
  serviceId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ipAddress: string;
  requestId: string;
}
```

---

## 🚀 **Deployment Checklist**

### **Pre-deployment**
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Documentation updated

### **Deployment Steps**
1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Environment Configuration**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL=your-production-db-url
   ```

3. **Service Registration**
   ```bash
   # Register production service apps
   curl -X POST https://your-api.com/api/service/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Production Service", "permissions": ["tasks:read"]}'
   ```

4. **Health Check**
   ```bash
   # Verify API health
   curl https://your-api.com/api/service/health
   ```

---

## 📚 **API Reference**

### **Authentication**
```http
POST /api/service/auth/login
Content-Type: application/json

{
  "serviceKey": "your-service-key"
}

Response:
{
  "token": "jwt-token",
  "expiresIn": 3600,
  "permissions": ["tasks:read", "tasks:create"]
}
```

### **Tasks API**
```http
# Create task
POST /api/service/tasks
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Task Description",
  "assigneeId": "user-id",
  "serviceType": "external-system"
}

# List tasks
GET /api/service/tasks?serviceType=external-system&status=TODO
Authorization: Bearer YOUR_TOKEN

# Update task
PATCH /api/service/tasks/task-id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

### **Notifications API**
```http
# Create notification
POST /api/service/notifications
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "userId": "user-id",
  "title": "Notification Title",
  "message": "Notification Message",
  "type": "info"
}

# Broadcast notification
POST /api/service/notifications/broadcast
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "System Alert",
  "message": "Maintenance scheduled",
  "type": "warning"
}
```

### **Approvals API**
```http
# Create approval request
POST /api/service/approvals
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "requestId": "REQ-001",
  "requestType": "TASK",
  "requesterId": "user-id",
  "department": "IT",
  "priority": "HIGH"
}

# Approve request
POST /api/service/approvals/approval-id/approve
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "comments": "Approved after review"
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Authentication Errors**
```bash
# Check service key validity
curl -X POST http://localhost:3000/api/service/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Regenerate service key
curl -X POST http://localhost:3000/api/service/auth/regenerate-key \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Rate Limiting**
```bash
# Check rate limit status
curl -X GET http://localhost:3000/api/service/rate-limit/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Database Connection**
```bash
# Test database connection
npx prisma db push

# Check migration status
npx prisma migrate status
```

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=service-api:*

# Start with debug mode
npm run dev:debug
```

---

## 📞 **Support & Maintenance**

### **Contact Information**
- **Technical Lead**: Eric Nguyen
- **Email**: eric.nguyen@tipa.co.th
- **Slack**: #service-api-support

### **Maintenance Schedule**
- **Weekly**: Performance review and optimization
- **Monthly**: Security audit and dependency updates
- **Quarterly**: Feature review and roadmap planning

### **Emergency Procedures**
1. **Service Outage**: Check health endpoints and logs
2. **Security Breach**: Rotate service keys and audit access
3. **Performance Issues**: Scale resources and optimize queries

---

## 📈 **Future Enhancements**

### **Planned Features**
- [ ] GraphQL API support
- [ ] Advanced webhook filtering
- [ ] Service app analytics dashboard
- [ ] Multi-tenant support
- [ ] API versioning system

### **Performance Optimizations**
- [ ] Database query optimization
- [ ] Caching strategy improvements
- [ ] CDN integration
- [ ] Load balancing

---

**Last Updated**: January 2, 2025  
**Version**: 1.0.0  
**Status**: Planning Phase  
**Next Review**: January 9, 2025 