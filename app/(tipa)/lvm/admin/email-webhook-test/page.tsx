"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Send,
  FileText
} from "lucide-react";
import Link from "next/link";

interface TestEmail {
  from: string;
  subject: string;
  text: string;
  expectedCategory: string;
  expectedPriority: string;
}

interface EmailData {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
  timestamp: string;
  attachments: unknown[];
}

interface TestResult {
  success: boolean;
  message?: string;
  action?: string;
  ticket?: {
    ticketNumber: string;
    status: string;
    category: string;
    priority: string;
  };
  comment?: {
    content: string;
  };
  error?: string;
  details?: string | Record<string, unknown>;
}

export default function EmailWebhookTestPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [customEmail, setCustomEmail] = useState({
    from: "",
    subject: "",
    text: ""
  });

  const testExamples: TestEmail[] = [
    {
      from: "Alice Smith <alice.smith@example.com>",
      subject: "URGENT: Critical bug in login system",
      text: "The login system is completely broken and users cannot access the application. This is affecting all users immediately.",
      expectedCategory: "BUG",
      expectedPriority: "URGENT"
    },
    {
      from: "Alice Smith <alice.smith@example.com>",
      subject: "Re: URGENT: Critical bug in login system",
      text: "Thank you for the quick response. I can confirm that the issue is still occurring. Here are additional details about the error messages I'm seeing...",
      expectedCategory: "BUG",
      expectedPriority: "URGENT"
    },
    {
      from: "Bob Johnson <bob.johnson@example.com>",
      subject: "Feature Request: Add dark mode to the interface",
      text: "It would be great if you could add a dark mode option to the user interface. This would improve user experience, especially for users working in low-light environments.",
      expectedCategory: "FEATURE_REQUEST",
      expectedPriority: "MEDIUM"
    },
    {
      from: "Carol Wilson <carol.wilson@example.com>",
      subject: "How to reset my password?",
      text: "I forgot my password and need help resetting it. Can you guide me through the process?",
      expectedCategory: "SUPPORT",
      expectedPriority: "MEDIUM"
    },
    {
      from: "David Brown <david.brown@example.com>",
      subject: "API integration problem",
      text: "We're having issues with the API integration. The authentication is failing and we're getting 401 errors consistently.",
      expectedCategory: "TECHNICAL_ISSUE",
      expectedPriority: "HIGH"
    },
    {
      from: "Eva Davis <eva.davis@example.com>",
      subject: "Suggestion for improvement",
      text: "It would be nice to have a search function in the reports section. This is not urgent but would be helpful when possible.",
      expectedCategory: "GENERAL",
      expectedPriority: "LOW"
    }
  ];

  const runTest = async (testEmail: EmailData) => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/email-webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to run test",
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleSelect = (example: TestEmail) => {
    setCustomEmail({
      from: example.from,
      subject: example.subject,
      text: example.text
    });
  };

  const handleCustomTest = () => {
    if (!customEmail.from || !customEmail.subject || !customEmail.text) {
      alert("Please fill in all fields");
      return;
    }

    const testEmail: EmailData = {
      from: customEmail.from,
      to: "test-support@yourcompany.com",
      subject: customEmail.subject,
      text: customEmail.text,
      html: customEmail.text.replace(/\n/g, '<br>'),
      messageId: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      attachments: []
    };

    runTest(testEmail);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span>Admin access required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/lvm/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Email Webhook Test</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/lvm/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Email Webhook Test</h1>
        </div>
        <p className="text-gray-600">
          Test the email-to-ticket conversion system by simulating incoming emails.
        </p>
      </div>

      {/* Test Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Test Examples</span>
          </CardTitle>
          <CardDescription>
            Click on any example to load it into the custom test form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testExamples.map((example, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleExampleSelect(example)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{example.subject}</h3>
                  <div className="flex space-x-1">
                    <Badge variant="outline" className="text-xs">
                      {example.expectedCategory}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        example.expectedPriority === 'URGENT' ? 'border-red-300 text-red-700' :
                        example.expectedPriority === 'HIGH' ? 'border-orange-300 text-orange-700' :
                        example.expectedPriority === 'MEDIUM' ? 'border-blue-300 text-blue-700' :
                        'border-gray-300 text-gray-700'
                      }`}
                    >
                      {example.expectedPriority}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">From: {example.from}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{example.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-green-600" />
            <span>Custom Email Test</span>
          </CardTitle>
          <CardDescription>
            Create a custom email to test the webhook conversion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              value={customEmail.from}
              onChange={(e) => setCustomEmail({ ...customEmail, from: e.target.value })}
              placeholder="John Doe <john.doe@example.com>"
            />
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={customEmail.subject}
              onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
              placeholder="Email subject line"
            />
          </div>
          
          <div>
            <Label htmlFor="text">Email Content</Label>
            <Textarea
              id="text"
              value={customEmail.text}
              onChange={(e) => setCustomEmail({ ...customEmail, text: e.target.value })}
              placeholder="Email body content..."
              rows={6}
            />
          </div>
          
          <Button 
            onClick={handleCustomTest}
            disabled={isLoading || !customEmail.from || !customEmail.subject || !customEmail.text}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Email Conversion
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Test Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {testResult.message}
                  </AlertDescription>
                </Alert>
                
                                 {testResult.ticket && (
                   <div className="space-y-2">
                     <h4 className="font-medium">
                       {testResult.action === "reply_added" ? "Updated Ticket:" : "Created Ticket:"}
                     </h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="font-medium">Ticket Number:</span>
                         <p className="text-gray-600">{testResult.ticket.ticketNumber}</p>
                       </div>
                       <div>
                         <span className="font-medium">Status:</span>
                         <p className="text-gray-600">{testResult.ticket.status}</p>
                       </div>
                       <div>
                         <span className="font-medium">Category:</span>
                         <p className="text-gray-600">{testResult.ticket.category}</p>
                       </div>
                       <div>
                         <span className="font-medium">Priority:</span>
                         <p className="text-gray-600">{testResult.ticket.priority}</p>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 {testResult.comment && (
                   <div className="space-y-2">
                     <h4 className="font-medium">Added Comment:</h4>
                     <div className="bg-gray-50 p-3 rounded border">
                       <p className="text-sm text-gray-700 whitespace-pre-wrap">{testResult.comment.content}</p>
                     </div>
                   </div>
                 )}
              </div>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {testResult.error}
                  {testResult.details && (
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 