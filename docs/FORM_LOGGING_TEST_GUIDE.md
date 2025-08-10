# Form Logging Test Guide

This guide explains how to test and verify the comprehensive form logging system in UXOne.

## Overview

The form logging system provides detailed tracking of user interactions with forms, including:
- Field focus/blur events
- Field value changes
- Validation errors
- Form submission attempts
- Step navigation (for multi-step forms)
- Form abandonment
- Performance metrics
- And much more

## Accessing the Test Form

Navigate to: `/test-form-logging`

This page provides a comprehensive test form that demonstrates all logging capabilities.

## Test Form Features

### 1. Multi-Step Form
- **Step 1**: Basic information (First Name, Last Name, Email)
- **Step 2**: Department details (Department, Role, Description)
- **Step 3**: Additional options (Priority, Urgent flag)

### 2. Real-Time Logging Display
The right panel shows:
- **Live Logs**: Real-time logging events as they occur
- **Form Analytics**: Field changes, validation errors, form duration
- **Form State**: Current form values and validation errors

### 3. Test Buttons
- **Reset Form**: Tests form reset logging
- **Test Abandonment**: Simulates form abandonment
- **Test Logging Methods**: Demonstrates various FormLogger utility methods
- **Test API Endpoint**: Tests backend form logging

## What Gets Logged

### Automatic Logging (via useFormLogger hook)
- Form initialization
- Field value changes (after 3+ characters)
- Validation errors
- Form submission (start, success, failure)
- Form abandonment
- Form reset

### Manual Logging (via FormLogger class)
- Field focus/blur events
- Step navigation
- Performance metrics
- Collaboration events
- Accessibility actions
- Error recovery attempts

## Testing Scenarios

### 1. Basic Form Interaction
1. Fill out the form fields
2. Navigate between steps
3. Submit the form
4. Check the live logs for events

### 2. Validation Testing
1. Try to submit with empty required fields
2. Enter invalid email format
3. Observe validation error logging

### 3. Form Lifecycle Testing
1. Start filling out the form
2. Use the "Test Abandonment" button
3. Check logs for abandonment event
4. Use "Reset Form" to test reset logging

### 4. API Integration Testing
1. Fill out the complete form
2. Submit and observe API call logging
3. Check both frontend and backend logs

## Expected Log Files

After testing, check these log files in the `logs/` directory:

- `user-actions.log` - All form interaction logs
- `database-operations.log` - Database-related form operations
- `exceptions.log` - Any errors during form processing

## Log Entry Examples

### Field Focus Event
```json
{
  "action": "FORM_FIELD_FOCUS",
  "description": "Field firstName focused in TEST_FORM",
  "formType": "TEST_FORM",
  "formId": "test-form-logging",
  "fields": ["firstName"],
  "timestamp": "2025-01-10T10:30:00.000Z",
  "userId": "test-user-123",
  "userName": "Test User"
}
```

### Form Submission Success
```json
{
  "action": "FORM_SUBMISSION_SUCCESS",
  "description": "Form TEST_FORM submitted successfully",
  "formType": "TEST_FORM",
  "formId": "test-form-logging",
  "timestamp": "2025-01-10T10:35:00.000Z",
  "userId": "test-user-123",
  "userName": "Test User",
  "context": {
    "submitStartTime": "2025-01-10T10:34:55.000Z",
    "submitEndTime": "2025-01-10T10:35:00.000Z",
    "totalFormTime": 5000,
    "totalFieldChanges": 8,
    "totalValidationErrors": 0,
    "success": true
  }
}
```

## Backend API Testing

The test form also tests the `/api/test-form-logging` endpoint, which demonstrates:

- Form data processing
- Validation logging
- Performance metrics
- Error handling and recovery
- Data export logging

## Troubleshooting

### No Logs Appearing
1. Check browser console for errors
2. Verify log file permissions
3. Check log configuration in `lib/logging/config.ts`

### Missing Events
1. Ensure form logging is properly initialized
2. Check that required fields are filled
3. Verify logging configuration options

### Performance Issues
1. Monitor log file sizes
2. Check for excessive logging in loops
3. Verify log rotation is working

## Integration with Real Forms

To use this logging system in production forms:

1. Import the `useFormLogger` hook
2. Initialize with your form configuration
3. Wrap your submit handler with `logSubmitHandler`
4. Use `FormLogger` methods for custom events

Example:
```typescript
const formLogger = useFormLogger(form, {
  formId: 'my-form',
  formType: 'USER_REGISTRATION',
  userId: user.id,
  userName: user.name
});

const onSubmit = formLogger.logSubmitHandler(async (data) => {
  // Your form submission logic
});
```

## Next Steps

After testing:
1. Review log files for completeness
2. Verify all expected events are captured
3. Check log format and structure
4. Test with real user data
5. Monitor performance impact
6. Configure log rotation and retention policies
