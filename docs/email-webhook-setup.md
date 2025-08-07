# Email Webhook System Documentation

## Overview

The Email Webhook System automatically converts incoming emails to support tickets in the UXOne system. When an email is sent to the configured support email address, it triggers a webhook that creates a ticket with the email content as the description.

## Features

- **Automatic Email-to-Ticket Conversion**: Converts emails to tickets based on subject, sender, and body content
- **Smart Category Detection**: Automatically determines ticket category based on email content keywords
- **Priority Classification**: Assigns priority levels (URGENT, HIGH, MEDIUM, LOW) based on email content
- **Team Assignment**: Routes tickets to appropriate teams based on category
- **System Notifications**: Sends notifications to team members when tickets are created
- **Email Metadata Preservation**: Stores original email details in ticket comments
- **Email Reply Handling**: Automatically detects replies and adds them as comments to existing tickets
- **Ticket Status Management**: Reopens closed tickets when replies are received

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Email webhook secret for authentication
EMAIL_WEBHOOK_SECRET=your-secure-webhook-secret-here

# Support email address (optional, for reference)
SUPPORT_EMAIL=test-support@yourcompany.com
```

### 2. Email Service Configuration

Configure your email service provider to send webhooks to the following endpoint:

```
POST https://your-domain.com/api/email-webhook
```

#### Required Headers:
```
Authorization: Bearer your-secure-webhook-secret-here
Content-Type: application/json
```

#### Expected Email Data Format:
```json
{
  "from": "John Doe <john.doe@example.com>",
  "to": "test-support@yourcompany.com",
  "subject": "URGENT: System is down",
  "text": "The system has been down for 2 hours...",
  "html": "<p>The system has been down for 2 hours...</p>",
  "messageId": "unique-message-id",
  "timestamp": "2024-01-15T10:30:00Z",
  "attachments": []
}
```

### 3. Email Service Providers

#### Gmail with Apps Script
```javascript
function processIncomingEmails() {
  const threads = GmailApp.getInboxThreads();
  
  for (const thread of threads) {
    const messages = thread.getMessages();
    
    for (const message of messages) {
      const emailData = {
        from: message.getFrom(),
        to: message.getTo(),
        subject: message.getSubject(),
        text: message.getPlainBody(),
        html: message.getHtmlBody(),
        messageId: message.getId(),
        timestamp: message.getDate().toISOString(),
        attachments: []
      };
      
      // Send to webhook
      const response = UrlFetchApp.fetch('https://your-domain.com/api/email-webhook', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-secure-webhook-secret-here',
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(emailData)
      });
    }
  }
}
```

#### SendGrid Inbound Parse
Configure SendGrid Inbound Parse to send to your webhook endpoint.

#### Mailgun Routes
Set up Mailgun routes to forward emails to your webhook endpoint.

## How It Works

### 1. Email Reception
- Email service receives email sent to support address
- Email service sends webhook to `/api/email-webhook` endpoint
- System validates webhook authentication

### 2. Content Analysis
- **Sender Extraction**: Extracts email and name from "from" field
- **Category Detection**: Analyzes subject and content for keywords
- **Priority Assessment**: Determines urgency based on content
- **Team Assignment**: Routes to appropriate department

### 3. Ticket Creation or Update
- **New Emails**: Generates unique ticket number (TIPA-HD-YYMMDD-XXX format)
- **Email Replies**: Adds comment to existing ticket and reopens if closed
- Creates ticket with email content as description
- Adds system comment with email metadata
- Sends notifications to assigned team

### 4. Category Detection Logic

| Category | Keywords |
|----------|----------|
| BUG | bug, error, crash, broken, not working, failed, issue |
| FEATURE_REQUEST | feature, enhancement, improvement, new, request |
| TECHNICAL_ISSUE | technical, system, server, database, api, integration |
| SUPPORT | help, support, question, how to, assistance |
| GENERAL | general, inquiry, info, information |

### 5. Priority Detection Logic

| Priority | Keywords |
|----------|----------|
| URGENT | urgent, critical, emergency, asap, immediate, broken, down |
| HIGH | important, high priority, blocking |
| LOW | low priority, when possible, suggestion, nice to have |
| MEDIUM | (default) |

### 6. Team Assignment

| Category | Assigned Team |
|----------|---------------|
| BUG | IS (Information Systems) |
| FEATURE_REQUEST | IS (Information Systems) |
| TECHNICAL_ISSUE | IS (Information Systems) |
| SUPPORT | CS (Customer Service) |
| GENERAL | CS (Customer Service) |

### 7. Email Reply Detection

The system automatically detects email replies and handles them differently:

#### Reply Detection Logic
- **Subject Matching**: Compares email subject (with reply prefixes removed) to existing ticket titles
- **Sender Matching**: Ensures the reply is from the same sender as the original ticket
- **Time Window**: Only looks for matches within the last 30 days to avoid false positives
- **Reply Prefixes**: Automatically removes common reply prefixes:
  - `Re:`, `Re :`, `Re-`, `Re -`
  - `Fw:`, `Fw :`, `Fw-`, `Fw -`
  - `Fwd:`, `Fwd :`, `Fwd-`, `Fwd -`
  - `Reply:`, `Reply :`, `Reply-`, `Reply -`

#### Reply Handling
- **Comment Addition**: Adds email content as a customer comment to the existing ticket
- **Status Update**: Reopens the ticket if it was previously closed or resolved
- **Notification**: Sends notifications to the assigned team about the new reply
- **Metadata Preservation**: Stores email details (timestamp, sender, subject) in the comment

## Testing

### 1. Admin Test Interface
Access the test interface at: `/admin/email-webhook-test`

This interface allows you to:
- Test with predefined examples
- Create custom email tests
- View conversion results
- Verify category and priority detection

### 2. API Testing
Test the webhook directly:

```bash
curl -X POST https://your-domain.com/api/email-webhook/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-webhook-secret-here" \
  -d '{
    "testEmail": {
      "from": "test@example.com",
      "subject": "URGENT: System issue",
      "text": "The system is not working properly."
    }
  }'
```

### 3. Test Examples

#### Urgent Bug Report
```json
{
  "from": "alice.smith@example.com",
  "subject": "URGENT: Critical bug in login system",
  "text": "The login system is completely broken and users cannot access the application."
}
```
**Expected Result**: BUG category, URGENT priority, assigned to IS team

#### Feature Request
```json
{
  "from": "bob.johnson@example.com",
  "subject": "Feature Request: Add dark mode",
  "text": "It would be great if you could add a dark mode option to the interface."
}
```
**Expected Result**: FEATURE_REQUEST category, MEDIUM priority, assigned to IS team

#### Email Reply
```json
{
  "from": "alice.smith@example.com",
  "subject": "Re: URGENT: Critical bug in login system",
  "text": "Thank you for the quick response. The issue is still occurring."
}
```
**Expected Result**: Comment added to existing ticket, ticket reopened if closed

## Monitoring and Troubleshooting

### 1. Logs
Check server logs for webhook processing:
```bash
# View webhook logs
tail -f logs/webhook.log
```

### 2. Common Issues

#### Authentication Failed
- Verify `EMAIL_WEBHOOK_SECRET` environment variable
- Check Authorization header format
- Ensure secret matches between email service and webhook

#### Missing Required Fields
- Ensure email contains: from, subject, and content (text or html)
- Check email service webhook configuration

#### Ticket Creation Failed
- Verify database connection
- Check system user exists for ticket creation
- Ensure proper permissions

### 3. Health Check
Test webhook health:
```bash
curl -X GET https://your-domain.com/api/email-webhook/test
```

## Security Considerations

1. **Webhook Secret**: Use a strong, unique secret for webhook authentication
2. **HTTPS**: Always use HTTPS for webhook endpoints
3. **Rate Limiting**: Consider implementing rate limiting for webhook endpoints
4. **Input Validation**: All email data is validated before processing
5. **Access Control**: Test endpoints are only available to admin users

## Customization

### 1. Category Keywords
Modify category detection by updating keywords in `app/api/email-webhook/route.ts`:

```typescript
const categoryKeywords = {
  'BUG': ['bug', 'error', 'crash', 'broken', 'not working', 'failed', 'issue'],
  'FEATURE_REQUEST': ['feature', 'enhancement', 'improvement', 'new', 'request'],
  // Add your custom categories and keywords
};
```

### 2. Team Assignment
Update team mapping in the `determineAssignedTeam` function:

```typescript
const teamMapping: Record<string, string> = {
  'BUG': 'IS',
  'FEATURE_REQUEST': 'IS',
  'TECHNICAL_ISSUE': 'IS',
  'SUPPORT': 'CS',
  'GENERAL': 'CS'
  // Add your custom mappings
};
```

### 3. Priority Detection
Modify priority keywords in the `determineTicketPriority` function.

## Support

For issues or questions about the email webhook system:
1. Check the logs for error messages
2. Test with the admin interface
3. Verify email service configuration
4. Contact the development team

## Future Enhancements

- Email attachment handling
- Advanced NLP for better category detection
- Custom email templates
- Email threading support
- Automated responses
- SLA tracking integration 