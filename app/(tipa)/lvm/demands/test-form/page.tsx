"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Package,
  ArrowRight
} from "lucide-react";
import MultiLineDemandForm from "@/components/MultiLineDemandForm";

export default function TestFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccess = (data: any) => {
    console.log("=== FORM SUCCESS CALLBACK ===");
    console.log("Form submitted successfully!");
    console.log("Form data:", data);
    console.log("=============================");
    
    setSuccessMessage("Demand created successfully! Check the console for detailed logs.");
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleError = (error: string) => {
    console.log("=== FORM ERROR CALLBACK ===");
    console.log("Form submission failed!");
    console.log("Error:", error);
    console.log("===========================");
    
    setErrorMessage(error);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  const handleSubmitStart = () => {
    console.log("=== FORM SUBMIT START ===");
    console.log("Form submission started...");
    console.log("=========================");
    
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Line Demand Form Test</h1>
        <p className="text-gray-600">
          Test the multi-line demand form with detailed console logging
        </p>
      </div>

      {/* Instructions */}
      <Card className="mb-6 border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Test Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h4 className="font-medium text-blue-900">Open Console</h4>
              </div>
              <p className="text-sm text-blue-700">
                Open browser developer tools (F12) and go to the Console tab
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h4 className="font-medium text-green-900">Fill Form</h4>
              </div>
              <p className="text-sm text-green-700">
                Fill out the form below and watch the console for real-time logs
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h4 className="font-medium text-purple-900">Submit</h4>
              </div>
              <p className="text-sm text-purple-700">
                Submit the form and see the complete data flow in the console
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Console Logs to Watch For:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li><strong>FORM STATE DEBUG:</strong> Real-time form values and validation</li>
              <li><strong>BU/DEPARTMENT SELECTION DEBUG:</strong> When you select BU/Department</li>
              <li><strong>EXPENSE ACCOUNT SELECTION DEBUG:</strong> When you select expense account</li>
              <li><strong>ADD/REMOVE DEMAND LINE DEBUG:</strong> When you add/remove lines</li>
              <li><strong>FORM SUBMISSION DEBUG:</strong> When you submit the form</li>
              <li><strong>API RESPONSE DEBUG:</strong> Server response details</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Success</span>
          </div>
          <p className="text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Package className="h-5 w-5 text-gray-600" />
            <span>Multi-Line Demand Form</span>
            <ArrowRight className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-500">(Check Console for Logs)</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Fill out this form and watch the browser console for detailed debugging information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiLineDemandForm
            onSuccess={handleSuccess}
            onError={handleError}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Console Instructions */}
      <div className="mt-8">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>Console Debugging Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Form State Logs</h4>
                <p className="text-sm text-gray-600">
                  Watch for "FORM STATE DEBUG" messages that show real-time form values, 
                  validation status, and field changes as you type.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">API Interaction Logs</h4>
                <p className="text-sm text-gray-600">
                  Look for "FORM SUBMISSION DEBUG" and "API RESPONSE DEBUG" messages 
                  that show the complete data flow from form to server.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Database Transaction Logs</h4>
                <p className="text-sm text-gray-600">
                  Check "DATABASE TRANSACTION DEBUG" messages to see how the demand 
                  and demand lines are created in the database.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Error Handling Logs</h4>
                <p className="text-sm text-gray-600">
                  Monitor "ERROR DEBUG" messages for detailed error information 
                  if something goes wrong during form submission.
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Sample Console Output</h4>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`=== FORM STATE DEBUG ===
Current form values: { bu: "TIPA", department: "PROC", ... }
Form errors: {}
Is form valid: true
Total estimated cost: 25000000
Number of demand lines: 1
=========================

=== FORM SUBMISSION DEBUG ===
Submitting form data: { bu: "TIPA", demandLines: [...], ... }
Demand lines count: 1
Total cost: 25000000
=============================

=== API RESPONSE DEBUG ===
Response status: 200
Response data: { success: true, data: {...} }
==========================`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 