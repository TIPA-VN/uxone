# Document Commenting System for Legal Review

## Overview

The Document Commenting System provides a comprehensive solution for legal department review of contract documents during the revise/review phase. It enables threaded discussions, text selection-based comments, and integrated workflow management.

## Features

### 🎯 **Core Functionality**
- **Threaded Comments**: Support for replies and nested discussions
- **Text Selection**: Comments linked to specific document sections
- **Role-Based Access**: Different permissions for different user roles
- **Comment Categories**: Legal, Technical, Commercial, Compliance, etc.
- **Priority Levels**: Low, Normal, High, Urgent
- **Resolution Tracking**: Mark comments as resolved/unresolved
- **Real-Time Updates**: Live comment synchronization

### 🔐 **Permission System**
- **Project Owners**: Full access to all comments
- **Project Members**: Can view and add comments
- **Legal Department**: Special review interface and permissions
- **Managers**: Can resolve comments and manage workflow
- **Admins**: Full system access

### 📊 **Comment Management**
- **Status Tracking**: Active, Resolved, Archived, Deleted
- **Author Attribution**: Track who made each comment
- **Timestamps**: Creation and modification tracking
- **Bulk Operations**: Resolve multiple comments at once

## Database Schema

### DocumentComment Model
```prisma
model DocumentComment {
  id            String           @id @default(cuid())
  documentId    String
  contractId    String?          // Link to contract if applicable
  content       String
  authorId      String
  author        User             @relation("DocumentCommentAuthor")
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  isResolved    Boolean          @default(false)
  resolvedAt    DateTime?
  resolvedBy    String?
  resolvedByUser User?           @relation("DocumentCommentResolver")
  
  // Comment threading
  parentId      String?
  parent        DocumentComment? @relation("CommentReplies")
  replies       DocumentComment[] @relation("CommentReplies")
  
  // Document positioning
  selectionStart Int?
  selectionEnd   Int?
  selectedText   String?
  
  // Comment status and priority
  status        CommentStatus    @default(ACTIVE)
  priority      CommentPriority  @default(NORMAL)
  category      CommentCategory  @default(GENERAL)
  
  // Document reference
  document      Document?        @relation(fields: [documentId], references: [id])
  contract      ContractDetails? @relation(fields: [contractId], references: [id])
}
```

### Enums
```prisma
enum CommentStatus {
  ACTIVE
  RESOLVED
  ARCHIVED
  DELETED
}

enum CommentPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum CommentCategory {
  GENERAL
  LEGAL
  TECHNICAL
  COMMERCIAL
  COMPLIANCE
  CLARIFICATION
  SUGGESTION
  ISSUE
}
```

## API Endpoints

### Comments Management
- `GET /api/contracts/[id]/comments` - Get all comments for a contract
- `POST /api/contracts/[id]/comments` - Create a new comment
- `PATCH /api/contracts/[id]/comments/[commentId]` - Update a comment
- `DELETE /api/contracts/[id]/comments/[commentId]` - Delete a comment (soft delete)

### Legal Review
- `GET /api/contracts/[id]/legal-review` - Get legal review status
- `POST /api/contracts/[id]/legal-review` - Perform legal review actions

## UI Components

### DocumentCommentSystem
Main component for displaying and managing comments.

**Props:**
- `contractId`: Contract ID
- `documentContent`: Document content for text selection
- `user`: Current user information
- `isLegalReview`: Whether this is a legal review context
- `onCommentAdded`: Callback when comment is added
- `onCommentUpdated`: Callback when comment is updated
- `onCommentDeleted`: Callback when comment is deleted

**Features:**
- Text selection-based commenting
- Threaded comment display
- Comment editing and deletion
- Priority and category management
- Resolution tracking

### LegalReviewPanel
Specialized component for legal department review workflow.

**Props:**
- `contractId`: Contract ID
- `user`: Current user information
- `onReviewStatusChange`: Callback when review status changes

**Features:**
- Review status overview
- Legal comment statistics
- Approval progress tracking
- Review action buttons (Start, Complete, Request Changes)
- Recent legal comments display

## Integration with Contract Workflow

### ContractWorkflowActions Integration
The commenting system is integrated into the existing contract workflow:

1. **Comment Button**: Toggle comment system visibility
2. **Legal Review Button**: Show legal review panel (for legal users)
3. **Status Integration**: Comments affect contract approval status
4. **Permission Checks**: Role-based access to comment features

### Workflow States
- **DRAFT**: Comments can be added by project members
- **REVIEW**: Legal department can add comments and manage review
- **APPROVED**: Comments are read-only
- **SIGNED**: All commenting disabled

## Usage Examples

### Adding a Comment
```typescript
const response = await fetch(`/api/contracts/${contractId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'This clause needs clarification',
    parentId: null, // Top-level comment
    selectionStart: 150,
    selectionEnd: 200,
    selectedText: 'payment terms',
    priority: 'HIGH',
    category: 'LEGAL'
  })
});
```

### Starting Legal Review
```typescript
const response = await fetch(`/api/contracts/${contractId}/legal-review`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'START_REVIEW',
    comment: 'Starting legal review process'
  })
});
```

### Resolving a Comment
```typescript
const response = await fetch(`/api/contracts/${contractId}/comments/${commentId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isResolved: true
  })
});
```

## Security Considerations

### Access Control
- Users can only access comments for contracts they have permission to view
- Comment authors can edit/delete their own comments
- Managers can resolve any comment
- Legal department has special review permissions

### Data Validation
- Comment content is sanitized and validated
- Text selection ranges are validated against document length
- Priority and category values are validated against enums

### Audit Trail
- All comment actions are logged with timestamps
- User attribution is maintained for all operations
- Comment history is preserved (soft delete)

## Performance Considerations

### Database Optimization
- Indexed on `contractId` and `documentId` for fast queries
- Pagination support for large comment lists
- Soft delete to maintain referential integrity

### UI Optimization
- Lazy loading of comment threads
- Debounced text selection handling
- Efficient re-rendering with React keys

## Future Enhancements

### Planned Features
1. **Real-Time Notifications**: WebSocket integration for live updates
2. **Comment Templates**: Pre-defined legal review comments
3. **Comment Analytics**: Review progress tracking and reporting
4. **Mobile Support**: Responsive design for mobile devices
5. **Comment Export**: Export comments to PDF/Word documents
6. **Advanced Search**: Search comments by content, author, category
7. **Comment Mentions**: @user notifications in comments
8. **File Attachments**: Attach files to comments

### Integration Opportunities
1. **Email Notifications**: Notify users of new comments
2. **Slack Integration**: Post comment updates to Slack channels
3. **Calendar Integration**: Schedule review deadlines
4. **Document Comparison**: Compare document versions with comments

## Troubleshooting

### Common Issues
1. **Comments not loading**: Check user permissions and contract access
2. **Text selection not working**: Ensure document content is properly loaded
3. **Legal review not accessible**: Verify user is in legal department or has admin role
4. **Comments not saving**: Check API endpoint availability and user authentication

### Debug Information
- Check browser console for API errors
- Verify user role and department in session
- Confirm contract status allows commenting
- Check database connection and Prisma client

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Author**: UXOne Development Team
