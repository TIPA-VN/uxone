import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

// Test endpoint for email webhook (only accessible in development)
export const POST = async (request: NextRequest) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Test endpoint not available in production" }, { status: 403 });
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { testEmail } = body;

    // Sample test email data
    const sampleEmail = testEmail || {
      from: "John Doe <john.doe@example.com>",
      to: "test-support@yourcompany.com",
      subject: "URGENT: System is down and not working",
      text: "Hello support team,\n\nThe system has been down for the past 2 hours and we cannot access any data. This is critical for our daily operations.\n\nPlease help us resolve this issue as soon as possible.\n\nBest regards,\nJohn Doe",
      html: "<p>Hello support team,</p><p>The system has been down for the past 2 hours and we cannot access any data. This is critical for our daily operations.</p><p>Please help us resolve this issue as soon as possible.</p><p>Best regards,<br>John Doe</p>",
      messageId: "test-message-123",
      timestamp: new Date().toISOString(),
      attachments: []
    };

    // Forward to the actual webhook endpoint
    const webhookUrl = `${request.nextUrl.origin}/api/email-webhook`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMAIL_WEBHOOK_SECRET || 'test-secret'}`
      },
      body: JSON.stringify(sampleEmail)
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Test email successfully converted to ticket",
        ticket: result.ticket,
        testData: sampleEmail
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to convert test email to ticket",
        details: result
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in test email webhook:', error);
    return NextResponse.json(
      { error: "Failed to process test email webhook" },
      { status: 500 }
    );
  }
};

// GET endpoint to show test examples
export const GET = async (request: NextRequest) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Test endpoint not available in production" }, { status: 403 });
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const testExamples = [
      {
        name: "Urgent Bug Report",
        description: "High priority bug report that should create an URGENT ticket",
        email: {
          from: "Alice Smith <alice.smith@example.com>",
          subject: "URGENT: Critical bug in login system",
          text: "The login system is completely broken and users cannot access the application. This is affecting all users immediately.",
          expectedCategory: "BUG",
          expectedPriority: "URGENT"
        }
      },
      {
        name: "Email Reply to Existing Ticket",
        description: "Reply to an existing ticket that should add a comment instead of creating a new ticket",
        email: {
          from: "Alice Smith <alice.smith@example.com>",
          subject: "Re: URGENT: Critical bug in login system",
          text: "Thank you for the quick response. I can confirm that the issue is still occurring. Here are additional details about the error messages I'm seeing...",
          expectedAction: "reply_added",
          expectedCategory: "BUG",
          expectedPriority: "URGENT"
        }
      },
      {
        name: "Feature Request",
        description: "Feature request that should create a MEDIUM priority ticket",
        email: {
          from: "Bob Johnson <bob.johnson@example.com>",
          subject: "Feature Request: Add dark mode to the interface",
          text: "It would be great if you could add a dark mode option to the user interface. This would improve user experience, especially for users working in low-light environments.",
          expectedCategory: "FEATURE_REQUEST",
          expectedPriority: "MEDIUM"
        }
      },
      {
        name: "General Support Question",
        description: "General support question that should create a SUPPORT ticket",
        email: {
          from: "Carol Wilson <carol.wilson@example.com>",
          subject: "How to reset my password?",
          text: "I forgot my password and need help resetting it. Can you guide me through the process?",
          expectedCategory: "SUPPORT",
          expectedPriority: "MEDIUM"
        }
      },
      {
        name: "Technical Issue",
        description: "Technical issue that should create a TECHNICAL_ISSUE ticket",
        email: {
          from: "David Brown <david.brown@example.com>",
          subject: "API integration problem",
          text: "We're having issues with the API integration. The authentication is failing and we're getting 401 errors consistently.",
          expectedCategory: "TECHNICAL_ISSUE",
          expectedPriority: "HIGH"
        }
      },
      {
        name: "Low Priority Suggestion",
        description: "Low priority suggestion that should create a GENERAL ticket",
        email: {
          from: "Eva Davis <eva.davis@example.com>",
          subject: "Suggestion for improvement",
          text: "It would be nice to have a search function in the reports section. This is not urgent but would be helpful when possible.",
          expectedCategory: "GENERAL",
          expectedPriority: "LOW"
        }
      }
    ];

    return NextResponse.json({
      success: true,
      message: "Email webhook test examples",
      webhookUrl: "/api/email-webhook",
      testUrl: "/api/email-webhook/test",
      examples: testExamples,
      instructions: {
        step1: "Use POST /api/email-webhook/test with a testEmail object to simulate an email",
        step2: "The system will automatically determine category and priority based on content",
        step3: "A ticket will be created with the email content as description",
        step4: "Team notifications will be sent to appropriate departments"
      }
    });

  } catch (error) {
    console.error('Error in test email webhook GET:', error);
    return NextResponse.json(
      { error: "Failed to get test examples" },
      { status: 500 }
    );
  }
}; 