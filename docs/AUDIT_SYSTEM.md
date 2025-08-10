# Audit System Documentation

## Overview

This document describes the audit system implemented in UXOne, which provides automatic tracking of who last updated database records and when. Instead of complex server-side logging, this system uses database fields and a reusable React component to display audit information.

## Database Schema Changes

### New Audit Fields

The following tables now include audit fields:

- **Task**: `lastUpdatedBy`, `lastUpdatedById`
- **Project**: `lastUpdatedBy`, `lastUpdatedById`  
- **Ticket**: `lastUpdatedBy`, `lastUpdatedById`

### Database Relations

Each audit field is properly related to the User model:
- `lastUpdatedById` → `User.id`
- `lastUpdatedByUser` → `User` (relation field)

## Components

### AuditInfo Component

A reusable React component that displays audit information in three variants:

#### Variants

1. **Default**: Standard layout with icons and badges
2. **Compact**: Minimal inline display
3. **Detailed**: Card-based layout with full information

#### Props

```typescript
interface AuditInfoProps {
  lastUpdated: Date | string | null;        // When the record was last updated
  lastUpdatedBy?: string | null;            // Name of user who last updated
  lastUpdatedById?: string | null;          // ID of user who last updated
  createdAt?: Date | string | null;         // When the record was created
  createdBy?: string | null;                // Name of user who created
  createdById?: string | null;              // ID of user who created
  showCreatedInfo?: boolean;                // Whether to show creation info
  className?: string;                       // Custom CSS classes
  variant?: 'default' | 'compact' | 'detailed'; // Display variant
}
```

#### Usage Examples

```tsx
// Basic usage
<AuditInfo
  lastUpdated={task.updatedAt}
  lastUpdatedBy={task.lastUpdatedBy}
/>

// With creation info
<AuditInfo
  lastUpdated={project.updatedAt}
  lastUpdatedBy={project.lastUpdatedBy}
  createdAt={project.createdAt}
  createdBy={project.createdBy}
  showCreatedInfo={true}
/>

// Compact variant
<AuditInfo
  lastUpdated={ticket.updatedAt}
  lastUpdatedBy={ticket.lastUpdatedBy}
  variant="compact"
/>

// Detailed variant
<AuditInfo
  lastUpdated={task.updatedAt}
  lastUpdatedBy={task.lastUpdatedBy}
  createdAt={task.createdAt}
  createdBy={task.createdBy}
  showCreatedInfo={true}
  variant="detailed"
/>
```

## Utility Functions

### PrismaAudit Class

Located in `lib/prisma-audit.ts`, provides utility methods for automatically updating audit fields:

#### Methods

- `getCurrentUserInfo()`: Gets current user from session
- `updateAuditFields()`: Updates a record with audit information
- `createWithAudit()`: Creates a record with audit information
- `updateManyWithAudit()`: Updates multiple records with audit information

#### Usage in API Routes

```typescript
import { PrismaAudit } from '@/lib/prisma-audit';

// Update a task with audit fields
const updatedTask = await PrismaAudit.updateAuditFields(
  prisma,
  prisma.task,
  taskId,
  { title: 'New Title', status: 'IN_PROGRESS' }
);

// Create a new project with audit fields
const newProject = await PrismaAudit.createWithAudit(
  prisma,
  prisma.project,
  { name: 'New Project', description: 'Project description' }
);
```

### Higher-Order Functions

```typescript
import { withAudit } from '@/lib/prisma-audit';

// Wrap any operation with audit fields
const createTaskWithAudit = withAudit(async (data) => {
  return await prisma.task.create({ data });
});

// Usage
const task = await createTaskWithAudit({
  title: 'New Task',
  description: 'Task description'
});
```

## Implementation in Existing Tables

### Adding Audit Fields to New Tables

1. **Update Prisma Schema**:
```prisma
model YourModel {
  // ... existing fields
  
  // Audit fields
  lastUpdatedBy     String?
  lastUpdatedById   String?
  lastUpdatedByUser User? @relation("YourModelLastUpdatedBy", fields: [lastUpdatedById], references: [id])
}
```

2. **Add Relation to User Model**:
```prisma
model User {
  // ... existing fields
  lastUpdatedYourModels YourModel[] @relation("YourModelLastUpdatedBy")
}
```

3. **Create Migration**:
```bash
npx prisma migrate dev --name add_audit_fields_to_your_model
```

### Using in API Routes

```typescript
// app/api/your-model/[id]/route.ts
import { PrismaAudit } from '@/lib/prisma-audit';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Update with audit fields automatically
    const updated = await PrismaAudit.updateAuditFields(
      prisma,
      prisma.yourModel,
      params.id,
      data
    );
    
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
}
```

## Displaying Audit Information

### In Task Components

```tsx
import { AuditInfo } from '@/components/ui/AuditInfo';

export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      
      {/* Display audit information */}
      <AuditInfo
        lastUpdated={task.updatedAt}
        lastUpdatedBy={task.lastUpdatedBy}
        createdAt={task.createdAt}
        createdBy={task.createdBy}
        showCreatedInfo={true}
        variant="compact"
      />
    </div>
  );
}
```

### In Project Components

```tsx
export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="project-header">
      <h1>{project.name}</h1>
      
      {/* Detailed audit information */}
      <AuditInfo
        lastUpdated={project.updatedAt}
        lastUpdatedBy={project.lastUpdatedBy}
        createdAt={project.createdAt}
        createdBy={project.createdBy}
        showCreatedInfo={true}
        variant="detailed"
      />
    </div>
  );
}
```

## Benefits

1. **Simple and Reliable**: No complex async context management
2. **Database-Level Tracking**: Audit information is stored with the data
3. **Reusable Component**: Consistent audit display across the application
4. **Automatic Updates**: Utility functions handle audit field updates
5. **Performance**: No additional logging overhead
6. **User-Friendly**: Clear display of who made changes and when

## Migration from Old System

If you have existing records without audit fields:

1. **Backfill Existing Records**:
```typescript
// Set default values for existing records
await prisma.task.updateMany({
  where: { lastUpdatedBy: null },
  data: { 
    lastUpdatedBy: 'System',
    lastUpdatedById: null
  }
});
```

2. **Update Existing API Routes**: Replace manual audit logging with the new utility functions

3. **Add AuditInfo Components**: Display audit information in your UI components

## Testing

Visit `/test-audit` to see the AuditInfo component in action with different variants and mock data.

## Future Enhancements

- Add audit fields to more tables as needed
- Implement audit trail for specific field changes
- Add export functionality for audit reports
- Implement audit field validation
