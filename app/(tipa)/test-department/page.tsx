"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestDepartmentPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Field Test</CardTitle>
            <CardDescription>No user session found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Please sign in to view department information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Department Field Test</h1>
        <p className="text-gray-600 mt-2">
          Testing the new department field structure
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Session Information</CardTitle>
          <CardDescription>Current user's department fields</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-sm text-gray-900 font-mono">{session.user.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-sm text-gray-900 font-mono">{session.user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900">{session.user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{session.user.email}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Department Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local Department</label>
                  <Badge variant="outline" className="font-mono">
                    {session.user.department || 'Not set'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for routing and permissions
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Central Department</label>
                  <Badge variant="outline" className="font-mono">
                    {session.user.centralDepartment || 'Not set'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    From central API (emp_dept)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                  <p className="text-sm text-gray-900">{session.user.departmentName || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <Badge variant="outline" className="font-mono">
                    {session.user.role}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Home Page Routing</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Local Department:</strong> {session.user.department || 'OPS'} → 
                  <strong> Home Page:</strong> /lvm{(session.user.department && session.user.department !== 'OPS') ? `/${session.user.department.toLowerCase()}` : ''}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  New users default to Operations (OPS) department
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Understanding the department field separation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Local Department (department)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Defaults to "OPS" (Operations) for new users</li>
                <li>• Used for home page routing and permissions</li>
                <li>• Can be manually updated by admins</li>
                <li>• NOT updated on subsequent logins</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Central Department (centralDepartment)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Comes from central API (emp_dept field)</li>
                <li>• Updated on every login</li>
                <li>• Used for reference only</li>
                <li>• Can be complex/complicated from central system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 