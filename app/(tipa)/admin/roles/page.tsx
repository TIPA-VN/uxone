import { auth } from "@/lib/auth";
import { canAccessPage } from "@/config/app";
import { redirect } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Settings, Activity } from "lucide-react";

export default async function RolesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = session.user.role as keyof typeof APP_CONFIG.roles;
  
  if (!canAccessPage(userRole, 'admin')) {
    redirect("/");
  }

  const roles = Object.entries(APP_CONFIG.roles).map(([key, role]) => ({
    key,
    ...role
  }));

  const roleCategories = {
    "Executive Level": roles.filter(role => role.level >= 8),
    "Senior Management": roles.filter(role => role.level >= 6 && role.level < 8),
    "Management": roles.filter(role => role.level >= 4 && role.level < 6),
    "Supervision": roles.filter(role => role.level >= 3 && role.level < 4),
    "Specialist": roles.filter(role => role.level >= 2 && role.level < 3),
    "Engineering": roles.filter(role => role.level >= 1 && role.level < 2),
    "Staff": roles.filter(role => role.level >= 0 && role.level < 1),
    "Operations": roles.filter(role => role.level >= 0 && role.level < 1)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage user roles, permissions, and access levels
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Roles:</span> {roles.length}
              </div>
            </div>
          </div>
        </div>

        {/* Role Categories */}
        <div className="space-y-8">
          {Object.entries(roleCategories).map(([category, categoryRoles]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryRoles.map((role) => (
                  <Card key={role.key} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{role.label}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          Level {role.level}
                        </Badge>
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Internal Key:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {role.key}
                            </code>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Role Statistics */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Role Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-500 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Roles</p>
                    <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-500 text-white">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Permission Types</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(roles.flatMap(r => r.permissions)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-500 text-white">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Access Levels</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(roles.map(r => r.level)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 