"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartmentCodes, getDepartmentNameByCode, getDepartmentByCode } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Building2, Code, Users } from "lucide-react";

export default function DepartmentCodesPage() {
  const departmentCodes = getDepartmentCodes();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Code Management</h1>
          <p className="text-gray-600 mt-2">
            Standardized department codes and their corresponding names
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <span className="text-sm text-gray-500">Department Mapping</span>
        </div>
      </div>

      {/* Department Codes Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Department Code Mapping</span>
          </CardTitle>
          <CardDescription>
            Standardized codes used throughout the system for department identification and access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentCodes).map(([code, name]) => {
              const department = getDepartmentByCode(code);
              return (
                <div
                  key={code}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-sm">
                      {code}
                    </Badge>
                    {department && (
                      <div 
                        className={`w-3 h-3 rounded-full ${department.color.replace('bg-', 'bg-')}`}
                        title={department.description}
                      />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
                  {department && (
                    <p className="text-sm text-gray-500">{department.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>How Department Codes Work</span>
          </CardTitle>
          <CardDescription>
            Understanding how department codes are used in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">User Department Mapping</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User departments are automatically mapped to standardized codes</li>
                  <li>• Case-insensitive matching (e.g., "is" → "IS")</li>
                  <li>• Partial name matching (e.g., "Information Systems" → "IS")</li>
                  <li>• Fallback to original value if no match found</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Access Control</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• RBAC permissions use standardized department codes</li>
                  <li>• Department-based filtering in tickets, projects, tasks</li>
                  <li>• IS department has special permissions for all tickets</li>
                  <li>• Other departments have scope-limited access</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Example Mapping</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>User Department:</strong> "Information Systems" → <strong>Code:</strong> "IS"</p>
                <p><strong>User Department:</strong> "Quality Control" → <strong>Code:</strong> "QC"</p>
                <p><strong>User Department:</strong> "is" → <strong>Code:</strong> "IS"</p>
                <p><strong>User Department:</strong> "qc" → <strong>Code:</strong> "QC"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department List */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>
            Complete list of departments with their codes and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Color</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(departmentCodes).map(([code, name]) => {
                  const department = getDepartmentByCode(code);
                  return (
                    <tr key={code} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          {code}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {department?.description || "No description available"}
                      </td>
                      <td className="py-3 px-4">
                        {department && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className={`w-4 h-4 rounded-full ${department.color.replace('bg-', 'bg-')}`}
                            />
                            <span className="text-sm text-gray-500">{department.color}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 