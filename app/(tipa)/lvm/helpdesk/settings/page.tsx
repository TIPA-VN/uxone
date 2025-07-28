"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  Settings, 
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock
} from "lucide-react";
import { APP_CONFIG, getRoles } from "@/config/app";

interface RBACMatrixProps {
  userRole: string;
}

function RBACMatrix({ userRole }: RBACMatrixProps) {
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-600" />
    );
  };

  const getPermissionBadge = (hasPermission: boolean) => {
    return hasPermission ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">Allowed</Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-200">Denied</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Role-Based Access Control (RBAC) Matrix
        </CardTitle>
        <CardDescription>
          Comprehensive view of permissions and access levels across all roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Features Matrix */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Feature Access Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Role</th>
                    {Object.keys(APP_CONFIG.rbac.features).map(feature => (
                      <th key={feature} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(getRoles()).map((role: any) => (
                    <tr key={role.value} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">
                        {role.label}
                      </td>
                      {Object.keys(APP_CONFIG.rbac.features).map(feature => {
                        const featureConfig = APP_CONFIG.rbac.features[feature as keyof typeof APP_CONFIG.rbac.features];
                        const hasAccess = featureConfig.roles.includes(role.value as any);
                        return (
                          <td key={feature} className="border border-gray-200 px-4 py-2 text-center">
                            {getPermissionIcon(hasAccess)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page Access Matrix */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Page Access Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Role</th>
                    {Object.keys(APP_CONFIG.rbac.pages).map(page => (
                      <th key={page} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        {page.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(getRoles()).map((role: any) => (
                    <tr key={role.value} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">
                        {role.label}
                      </td>
                      {Object.keys(APP_CONFIG.rbac.pages).map(page => {
                        const pageConfig = APP_CONFIG.rbac.pages[page as keyof typeof APP_CONFIG.rbac.pages];
                        const hasAccess = pageConfig.roles.includes(role.value as any);
                        return (
                          <td key={page} className="border border-gray-200 px-4 py-2 text-center">
                            {getPermissionIcon(hasAccess)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Access Matrix */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">API Access Matrix</h3>
            <div className="space-y-2">
              {Object.entries(APP_CONFIG.rbac.api).map(([endpoint, methods]) => (
                <div key={endpoint} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{endpoint}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => {
                      const hasAccess = (methods as any)[method as keyof typeof methods]?.length > 0;
                      return (
                        <div key={method} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">{method}</span>
                          {getPermissionBadge(hasAccess)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Hierarchy */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Role Hierarchy</h3>
            <div className="space-y-2">
              {Object.values(getRoles()).map((role: any) => (
                <div key={role.value} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Level {role.level}
                      </Badge>
                      <span className="font-medium text-gray-900">{role.label}</span>
                      <span className="text-sm text-gray-500">({role.value})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRole(role.value)}
                    >
                      {expandedRoles.includes(role.value) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {expandedRoles.includes(role.value) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.map((permission: string) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemSettingsPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isISDepartment, setIsISDepartment] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const userRole = session.user.role?.toUpperCase();
      const userDepartment = session.user.department?.toUpperCase();
      
      setIsAdmin(userRole === 'ADMIN' || userRole === 'SENIOR MANAGER' || userRole === 'SENIOR_MANAGER');
      setIsISDepartment(userDepartment === 'IS');
    }
  }, [session]);

  const canViewRBAC = isAdmin && isISDepartment;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">
            Configuration and access control management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            IS Department
          </Badge>
          {canViewRBAC && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {session?.user?.role?.toUpperCase() === 'ADMIN' ? 'Admin Access' : 'Senior Manager Access'}
            </Badge>
          )}
        </div>
      </div>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" />
            Access Control
          </CardTitle>
          <CardDescription>
            Manage system access and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage user accounts and roles</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Security Settings</h3>
                  <p className="text-sm text-gray-500">Configure security policies and authentication</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">System Configuration</h3>
                  <p className="text-sm text-gray-500">General system settings and preferences</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RBAC Matrix - Only for IS Admin */}
      {canViewRBAC ? (
        <RBACMatrix userRole={session?.user?.role || ''} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              RBAC matrix is only available to IS department administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                You need administrator or senior manager privileges in the IS department to view the RBAC matrix.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Current role: {session?.user?.role || 'Unknown'} | 
                Department: {session?.user?.department || 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system configuration and version details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {APP_CONFIG.name}</p>
                <p><span className="font-medium">Version:</span> {APP_CONFIG.version}</p>
                <p><span className="font-medium">Description:</span> {APP_CONFIG.description}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Role:</span> {session?.user?.role || 'Unknown'}</p>
                <p><span className="font-medium">Department:</span> {session?.user?.department || 'Unknown'}</p>
                <p><span className="font-medium">Username:</span> {session?.user?.username || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 