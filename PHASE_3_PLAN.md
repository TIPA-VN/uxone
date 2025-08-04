# Phase 3: Notifications API Implementation

## Overview
Implement a comprehensive Notifications API for service applications to manage notifications within UXOne, following the same security and service isolation patterns established in Phase 2.

## Objectives
- Create service-specific notification management
- Extend existing Notification model with service metadata
- Implement CRUD operations for notifications
- Support notification preferences and delivery
- Maintain service isolation and security

## API Endpoints to Implement

### 1. Core Notifications API
- `GET /api/service/notifications` - List notifications with filtering
- `POST /api/service/notifications` - Create new notification
- `PATCH /api/service/notifications` - Bulk update notifications
- `DELETE /api/service/notifications` - Bulk delete notifications

### 2. Individual Notification API
- `GET /api/service/notifications/{id}` - Get single notification
- `PATCH /api/service/notifications/{id}` - Update single notification
- `DELETE /api/service/notifications/{id}` - Delete single notification

### 3. Notification Actions
- `POST /api/service/notifications/{id}/mark-read` - Mark as read
- `POST /api/service/notifications/{id}/mark-unread` - Mark as unread
- `POST /api/service/notifications/bulk-mark-read` - Bulk mark as read
- `POST /api/service/notifications/bulk-mark-unread` - Bulk mark as unread

### 4. Notification Preferences
- `GET /api/service/notifications/preferences` - Get service notification preferences
- `PATCH /api/service/notifications/preferences` - Update preferences

## Database Schema Extensions

### ServiceNotification Model
```prisma
model ServiceNotification {
  id              String   @id @default(cuid())
  notificationId  String   @unique // Reference to Notification
  serviceId       String   // Reference to ServiceApp
  serviceType     String   // Type of notification for this service
  priority        String   @default("NORMAL") // HIGH, NORMAL, LOW
  expiresAt       DateTime? // Optional expiration
  metadata        Json?    // Service-specific metadata
  createdAt       DateTime @default(now())
  
  // Relations
  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  service         ServiceApp   @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  
  @@index([serviceId, serviceType])
  @@index([notificationId])
}
```

### Update Notification Model
```prisma
model Notification {
  // ... existing fields ...
  serviceNotification ServiceNotification?
}
```

### Update ServiceApp Model
```prisma
model ServiceApp {
  // ... existing fields ...
  serviceNotifications ServiceNotification[]
}
```

## Implementation Steps

### Step 1: Database Schema Updates
1. Add ServiceNotification model to schema.prisma
2. Update existing models with relations
3. Run database migration

### Step 2: Core Notifications API
1. Create `/api/service/notifications/route.ts`
2. Implement GET (list with filtering)
3. Implement POST (create with service metadata)
4. Implement PATCH (bulk update)
5. Implement DELETE (bulk delete)

### Step 3: Individual Notification API
1. Create `/api/service/notifications/[id]/route.ts`
2. Implement GET (single notification)
3. Implement PATCH (update single)
4. Implement DELETE (delete single)

### Step 4: Notification Actions API
1. Create action endpoints for mark-read/unread
2. Implement bulk action endpoints
3. Add validation and service isolation

### Step 5: Notification Preferences
1. Create preferences endpoints
2. Implement service-specific notification settings

### Step 6: Testing & Validation
1. Create test service with notification permissions
2. Test all CRUD operations
3. Test notification actions
4. Test service isolation
5. Validate error handling

## Security Features

### Authentication & Authorization
- Service token validation required for all endpoints
- Permission-based access control:
  - `notifications:read` - Read notifications
  - `notifications:create` - Create notifications
  - `notifications:update` - Update notifications
  - `notifications:delete` - Delete notifications
  - `notifications:manage` - Manage notification preferences

### Service Isolation
- Each service can only access its own notifications
- Service-specific metadata and filtering
- Cross-service data isolation

### Rate Limiting
- Per-service rate limits (inherited from service app)
- Bulk operation limits
- Notification creation limits

## Data Models

### Notification Creation Request
```typescript
interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  recipientId?: string;
  department?: string;
  expiresAt?: string; // ISO date string
  serviceType: string;
  externalReference?: string;
  metadata?: Record<string, any>;
}
```

### Notification Response
```typescript
interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  recipientId?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  serviceNotification?: {
    serviceType: string;
    externalReference?: string;
    metadata?: Record<string, any>;
    priority: string;
    expiresAt?: string;
  };
  recipient?: {
    id: string;
    name: string;
    username: string;
    department: string;
  };
}
```

## Filtering & Pagination

### Query Parameters
- `serviceType` - Filter by service type
- `type` - Filter by notification type
- `priority` - Filter by priority
- `isRead` - Filter by read status
- `recipientId` - Filter by recipient
- `department` - Filter by department
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

### Sorting
- `sortBy` - Field to sort by (createdAt, updatedAt, priority, title)
- `sortOrder` - Sort order (asc, desc)

## Error Handling

### Standard Error Responses
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid service token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (notification not found or access denied)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Validation
- Required fields validation
- Data type validation
- Service ownership validation
- Permission validation

## Testing Strategy

### Manual Testing
1. Create test service with notification permissions
2. Test notification creation with various types
3. Test filtering and pagination
4. Test notification actions (mark read/unread)
5. Test bulk operations
6. Test service isolation

### Automated Testing
1. Unit tests for validation logic
2. Integration tests for API endpoints
3. Security tests for service isolation
4. Performance tests for bulk operations

## Success Criteria

### Functional Requirements
- ✅ All CRUD operations working
- ✅ Service isolation maintained
- ✅ Proper error handling
- ✅ Filtering and pagination working
- ✅ Notification actions functional
- ✅ Preferences management working

### Non-Functional Requirements
- ✅ Response times < 500ms
- ✅ Proper security implementation
- ✅ Rate limiting functional
- ✅ Database integrity maintained
- ✅ Clean API design

## Dependencies

### Existing Infrastructure
- Service authentication middleware
- Permission system
- Rate limiting
- Database schema
- Error handling patterns

### New Dependencies
- None (using existing patterns)

## Timeline Estimate
- **Step 1:** Database schema (30 minutes)
- **Step 2:** Core API (2 hours)
- **Step 3:** Individual API (1 hour)
- **Step 4:** Actions API (1 hour)
- **Step 5:** Preferences API (30 minutes)
- **Step 6:** Testing (1 hour)

**Total Estimated Time:** 6 hours

## Next Phase
After Phase 3 completion, proceed to **Phase 4: Approvals API Implementation** 