'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useClientFormLogger } from '@/hooks/useClientFormLogger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TestFormData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  projectName: string;
  description: string;
  priority: string;
  budget: number;
}

export default function TestFormLoggingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalFields: number;
    modifiedFields: number;
    validationErrors: number;
    submissionAttempts: number;
    lastModified: string;
    accessCount: number;
  } | null>(null);

  const form = useForm<TestFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      projectName: '',
      description: '',
      priority: 'medium',
      budget: 0
    }
  });

  // Mock user data for security audit logging
  const mockUser = useMemo(() => ({
    userId: 'USER_001',
    userName: 'John Doe',
    userRole: 'Project Manager',
    userDepartment: 'Engineering',
    sessionId: 'SESS_TEST_001',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }), []);

  // Create stable config for form logging
  const formLoggerConfig = useMemo(() => ({
    formId: 'test-form-logging',
    formType: 'TEST_FORM',
    // Enhanced workflow and business context
    workflowName: 'Project Request Workflow',
    workflowStep: 'Step 1', // Start with stable initial value
    businessPurpose: 'New Project Request and Approval',
    businessProcess: 'Engineering Project Management',
    relatedEntities: {
      departmentId: 'ENG_001',
      projectId: 'PROJ_TEST_001',
      requestId: 'REQ_TEST_001'
    },
    businessRules: {
      requiresApproval: true,
      approvalLevel: 'Department Manager',
      budgetThreshold: 10000,
      departmentRestrictions: ['Engineering', 'IT', 'Operations']
    },
    ...mockUser
  }), [mockUser]);

  // Initialize form logging with security audit focus
  const formLogger = useClientFormLogger(form, formLoggerConfig);

  // Update workflow step when currentStep changes (prevents hydration mismatch)
  useEffect(() => {
    // Note: In a real implementation, you might want to reinitialize the logger
    // or have a method to update the workflow step dynamically
    // For now, we'll just log the step change
    addLog(`Workflow step updated to: Step ${currentStep} - ${getStepDescription(currentStep)}`);
  }, [currentStep]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleString()}: ${message}`]);
  };

  const testLoggingMethods = () => {
    addLog('Testing security audit logging methods...');

    // Test suspicious activity logging using the hook
    formLogger.logSuspiciousActivity(
      'RAPID_FIELD_CHANGES',
      'User changing fields too rapidly (potential automation)',
      'HIGH'
    );

    addLog('Security audit logging methods tested');
  };

  const onFocus = (fieldName: string) => {
    addLog(`${fieldName} field focused`);
  };

  const onBlur = (fieldName: string) => {
    addLog(`${fieldName} field blurred`);
  };

  const onSubmit = async (data: TestFormData) => {
    addLog('Form submitted successfully');
    console.log('Form data:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get analytics for security reporting
    const formAnalytics = formLogger.getFormAnalytics();
    setAnalytics(formAnalytics);
    
    addLog('Form analytics captured for security audit');
  };

  // Create a submit handler with logging
  const handleSubmitWithLogging = formLogger.logSubmitHandler(onSubmit);

  const handleStepChange = (newStep: number) => {
    if (newStep >= 1 && newStep <= 3) {
      setCurrentStep(newStep);
      addLog(`Step changed from ${currentStep} to ${newStep}`);
      
      // Update workflow step in logging context
      // Note: In a real implementation, you might want to reinitialize the logger
      // or have a method to update the workflow step dynamically
      addLog(`Workflow context updated: Step ${newStep} - ${getStepDescription(newStep)}`);
    }
  };

  const getStepDescription = (step: number): string => {
    switch (step) {
      case 1: return 'Personal Information Collection';
      case 2: return 'Project Details Definition';
      case 3: return 'Budget Approval & Submission';
      default: return 'Unknown Step';
    }
  };

  const handleFormReset = () => {
    form.reset();
    formLogger.logFormReset('User manually reset form');
    addLog('Form reset - security audit logged');
  };

  const handleFormAbandonment = () => {
    formLogger.logFormAbandonment('User abandoned form via test button');
    addLog('Form abandonment - security audit logged');
  };

  const exportAuditLogs = () => {
    // This would typically export to a file or send to a server
    const auditData = {
      user: mockUser,
      formAnalytics: analytics,
      logs: logs,
      timestamp: new Date().toISOString()
    };
    
    console.log('Audit Logs Export:', auditData);
    addLog('Audit logs exported for compliance reporting');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔒 Security Audit Form Logging Test
            <Badge variant="secondary">Security Focused</Badge>
          </CardTitle>
          <CardDescription>
            Test form with comprehensive security audit logging. 
            All actions are logged with WHO, WHAT, WHERE, WHEN, WHY information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* User Information Display */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">👤 Current User Context</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>User:</strong> {mockUser.userName}</div>
              <div><strong>Role:</strong> {mockUser.userRole}</div>
              <div><strong>Department:</strong> {mockUser.userDepartment}</div>
              <div><strong>Session:</strong> {mockUser.sessionId}</div>
              <div><strong>IP:</strong> {mockUser.ipAddress}</div>
              <div><strong>User Agent:</strong> {mockUser.userAgent.substring(0, 50)}...</div>
            </div>
          </div>

          {/* Workflow Context Display */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800">🏢 Current Workflow Context</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <div><strong>Workflow:</strong> Project Request Workflow</div>
              <div><strong>Current Step:</strong> {currentStep} - {getStepDescription(currentStep)}</div>
              <div><strong>Purpose:</strong> New Project Request and Approval</div>
              <div><strong>Process:</strong> Engineering Project Management</div>
              <div><strong>Department ID:</strong> ENG_001</div>
              <div><strong>Requires Approval:</strong> Yes (Department Manager)</div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              💡 This context is automatically logged with every form interaction for security auditing and compliance.
            </div>
          </div>

          {/* Form Steps */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(step => (
              <Button
                key={step}
                variant={currentStep === step ? 'default' : 'outline'}
                onClick={() => handleStepChange(step)}
                size="sm"
              >
                Step {step}
              </Button>
            ))}
          </div>

          <form onSubmit={form.handleSubmit(handleSubmitWithLogging)} className="space-y-4">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1: Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName', { required: 'First name is required' })}
                      onFocus={() => onFocus('firstName')}
                      onBlur={() => onBlur('firstName')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName', { required: 'Last name is required' })}
                      onFocus={() => onFocus('firstName')}
                      onBlur={() => onBlur('lastName')}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    onFocus={() => onFocus('email')}
                    onBlur={() => onBlur('email')}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    {...form.register('department', { required: 'Department is required' })}
                    onFocus={() => onFocus('department')}
                    onBlur={() => onBlur('department')}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2: Project Details</h3>
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    {...form.register('projectName', { required: 'Project name is required' })}
                    onFocus={() => onFocus('projectName')}
                    onBlur={() => onBlur('projectName')}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description', { required: 'Description is required' })}
                    onFocus={() => onFocus('description')}
                    onBlur={() => onBlur('description')}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    {...form.register('priority')}
                    className="w-full p-2 border rounded-md"
                    onFocus={() => onFocus('priority')}
                    onBlur={() => onBlur('priority')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 3: Budget & Submit</h3>
                <div>
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    {...form.register('budget', { 
                      required: 'Budget is required',
                      min: { value: 0, message: 'Budget must be positive' }
                    })}
                    onFocus={() => onFocus('budget')}
                    onBlur={() => onBlur('budget')}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Submit Form
                  </Button>
                  <Button type="button" variant="outline" onClick={handleFormReset}>
                    Reset Form
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            {currentStep < 3 && (
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={() => handleStepChange(currentStep + 1)}
                  disabled={!form.formState.isValid}
                >
                  Next Step
                </Button>
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleStepChange(currentStep - 1)}
                  >
                    Previous Step
                  </Button>
                )}
              </div>
            )}
          </form>

          <Separator />

          {/* Security Audit Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔒 Security Audit Controls</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={testLoggingMethods} variant="outline">
                Test Security Logging
              </Button>
              <Button onClick={handleFormAbandonment} variant="outline">
                Test Form Abandonment
              </Button>
              <Button onClick={exportAuditLogs} variant="outline">
                Export Audit Logs
              </Button>
            </div>
          </div>

          {/* Form Analytics */}
          {analytics && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📊 Security Audit Analytics</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>Total Fields:</strong> {analytics.totalFields}</div>
                <div><strong>Modified Fields:</strong> {analytics.modifiedFields}</div>
                <div><strong>Validation Errors:</strong> {analytics.validationErrors}</div>
                <div><strong>Submission Attempts:</strong> {analytics.submissionAttempts}</div>
                <div><strong>Access Count:</strong> {analytics.accessCount}</div>
                <div><strong>Last Modified:</strong> {new Date(analytics.lastModified).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Real-time Logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📝 Security Audit Logs</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Interact with the form to see security audit logs.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              💡 Check browser console for detailed security audit logs with WHO, WHAT, WHERE, WHEN, WHY information.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
