# Contract Lifecycle Management System

This document describes the comprehensive contract lifecycle management system that has been implemented to handle contract expiration, hold, and termination workflows.

## Features

### 1. Contract Lifecycle States
- **DRAFT**: Initial contract creation
- **REVIEW**: Under approval process
- **APPROVED**: Approved but not yet signed
- **SIGNED**: Signed and ready for execution
- **EXECUTING**: Currently active
- **COMPLETED**: Successfully completed
- **TERMINATED**: Ended before completion
- **ON_HOLD**: Temporarily suspended

### 2. Expiration Management
- **Automatic Expiration Monitoring**: System automatically monitors contracts approaching expiration
- **Configurable Warning Periods**: Set custom warning days (default: 30 days)
- **Auto-Renewal**: Contracts can be configured for automatic renewal
- **Bulk Extension**: Extend multiple contracts at once
- **Expiration Dashboard**: Visual overview of all expiring contracts

### 3. Hold Management
- **Put on Hold**: Temporarily suspend contract execution
- **Hold Reasons**: Track why contracts are put on hold
- **Resume**: Remove hold status and continue execution
- **Hold History**: Complete audit trail of hold actions

### 4. Termination Management
- **Contract Termination**: Permanently end contracts
- **Termination Reasons**: Required documentation for terminations
- **Termination History**: Track who terminated contracts and when
- **Audit Trail**: Complete lifecycle event history

## Database Schema Changes

### New Fields in ContractDetails
```sql
-- Hold management
isOnHold: Boolean (default: false)
holdReason: String?
holdDate: DateTime?
holdByUserId: String?

-- Termination management
terminationReason: String?
terminationDate: DateTime?
terminatedByUserId: String?

-- Expiration management
expirationWarningDays: Int? (default: 30)
autoRenewal: Boolean (default: false)
renewalNoticeDays: Int? (default: 60)
lastExpirationNotice: DateTime?
```

### New ContractLifecycleEvent Table
```sql
id: String (Primary Key)
contractId: String (Foreign Key)
eventType: String (HOLD, UNHOLD, TERMINATE, etc.)
eventDate: DateTime
userId: String (Foreign Key)
reason: String?
metadata: JSON?
```

## API Endpoints

### Contract Lifecycle Operations
- `POST /api/contracts/[id]/lifecycle` - Perform lifecycle actions
- `GET /api/contracts/[id]/lifecycle` - Get lifecycle event history

### Expiration Monitoring
- `GET /api/contracts/expiration-monitor` - List expiring contracts
- `POST /api/contracts/expiration-monitor` - Bulk operations

### Automated Monitoring
- `POST /api/contracts/automated-monitoring` - Cron job endpoint
- `GET /api/contracts/automated-monitoring` - Monitoring summary

## UI Components

### ContractLifecycleManager
Comprehensive lifecycle management interface with tabs for:
- **Overview**: Current status and expiration info
- **Actions**: Hold, terminate, extend operations
- **Settings**: Auto-renewal and notification preferences
- **History**: Complete lifecycle event timeline

### ContractExpirationDashboard
Dashboard for monitoring contract expirations:
- **Summary Cards**: Critical, warning, and normal contracts
- **Filterable Table**: Sort and filter by various criteria
- **Bulk Actions**: Extend multiple contracts simultaneously
- **Notification Management**: Send expiration warnings
- **CSV Export**: Export expiration data

### Enhanced ContractWorkflowActions
Updated workflow component with new actions:
- **Hold/Resume**: Put contracts on hold or resume them
- **Status Indicators**: Visual status with ON_HOLD state
- **Enhanced History**: Show lifecycle events

## Automated Monitoring

### Cron Job Setup
The system includes automated monitoring capabilities:

1. **Daily Expiration Check**: 
   ```bash
   # Run every day at 9 AM
   0 9 * * * node /path/to/uxone/scripts/contract-monitoring-cron.js check-expirations
   ```

2. **Weekly Auto-Renewal Process**:
   ```bash
   # Run every Sunday at 2 AM
   0 2 * * 0 node /path/to/uxone/scripts/contract-monitoring-cron.js process-renewals
   ```

3. **Full Monitoring** (recommended):
   ```bash
   # Run daily at 8 AM
   0 8 * * * node /path/to/uxone/scripts/contract-monitoring-cron.js full-monitoring
   ```

### Environment Variables
```env
# Optional: Secure cron job endpoint
CRON_SECRET_TOKEN=your-secret-token-here

# Application URL for cron jobs
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Usage Guide

### 1. Managing Contract Lifecycle
1. Navigate to a contract detail page
2. Use the ContractLifecycleManager component
3. Switch between tabs to access different functions:
   - **Overview**: See current status and expiration info
   - **Actions**: Perform hold, terminate, or extend actions
   - **Settings**: Configure auto-renewal preferences
   - **History**: View complete lifecycle timeline

### 2. Monitoring Expirations
1. Access the Contract Expiration Dashboard
2. Use filters to focus on specific time periods
3. Review critical and warning contracts
4. Send notifications or perform bulk extensions as needed

### 3. Setting Up Automated Monitoring
1. Configure environment variables
2. Set up cron jobs using the provided script
3. Monitor logs for successful execution
4. Review notification delivery and auto-renewal results

## Notification System

The system automatically sends notifications for:
- **Expiration Warnings**: Sent based on configured warning days
- **Renewal Notices**: For contracts with auto-renewal enabled
- **Hold Actions**: When contracts are put on hold
- **Terminations**: When contracts are terminated

Recipients include:
- Contract owners (project owners)
- Current approvers
- Relevant stakeholders

## Best Practices

### 1. Expiration Management
- Set appropriate warning days (typically 30-60 days)
- Enable auto-renewal only for routine contracts
- Review expiration dashboard regularly
- Use bulk operations for efficiency

### 2. Hold Management
- Always provide clear reasons for holds
- Review held contracts regularly
- Resume contracts promptly when issues are resolved
- Monitor hold duration for compliance

### 3. Termination Management
- Document termination reasons thoroughly
- Ensure proper approvals before termination
- Maintain audit trails for legal compliance
- Review termination patterns for insights

### 4. Automated Monitoring
- Set up redundant monitoring (multiple cron jobs)
- Monitor cron job execution logs
- Test notification delivery regularly
- Review and adjust warning thresholds

## Security Considerations

- **Access Control**: Ensure only authorized users can perform lifecycle actions
- **Audit Trails**: All actions are logged with user information and timestamps
- **API Security**: Cron endpoints use token-based authentication
- **Data Integrity**: Database transactions ensure consistency

## Troubleshooting

### Common Issues
1. **Notifications not sent**: Check email configuration and user permissions
2. **Cron jobs failing**: Verify environment variables and network connectivity
3. **Lifecycle actions not working**: Check user permissions and contract status
4. **Dashboard not loading**: Verify database connectivity and API endpoints

### Monitoring and Logs
- Check application logs for error messages
- Monitor cron job execution results
- Review notification delivery status
- Audit lifecycle event history for inconsistencies

## Future Enhancements

Potential improvements to consider:
- **Advanced Renewal Logic**: More sophisticated renewal rules
- **Integration with External Systems**: Calendar integration, ERP systems
- **Advanced Reporting**: Analytics and insights on contract lifecycle
- **Mobile Notifications**: Push notifications for critical events
- **Workflow Automation**: Advanced business rules and triggers
