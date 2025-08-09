import { auth } from "@/lib/auth";
import { canAccessPage } from "@/config/app";
import { redirect } from "next/navigation";
import { APP_CONFIG, getHelpdeskPermissionMatrix, getHelpdeskPermissionsForRole } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Settings, Activity, MessageSquare, HelpCircle, Database, FileText, UserCheck, Lock } from "lucide-react";

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

  const helpdeskMatrix = getHelpdeskPermissionMatrix();

  // Define all functions/modules and their CRUD permissions
  const functions = [
    { key: 'users', label: 'Users', icon: Users, color: 'bg-blue-500' },
    { key: 'projects', label: 'Projects', icon: FileText, color: 'bg-green-500' },
    { key: 'tasks', label: 'Tasks', icon: Activity, color: 'bg-purple-500' },
    { key: 'team', label: 'Team', icon: UserCheck, color: 'bg-orange-500' },
    { key: 'reports', label: 'Reports', icon: FileText, color: 'bg-indigo-500' },
    { key: 'settings', label: 'Settings', icon: Settings, color: 'bg-gray-500' },
    { key: 'security', label: 'Security', icon: Lock, color: 'bg-red-500' },
    { key: 'database', label: 'Database', icon: Database, color: 'bg-teal-500' },
    { key: 'helpdesk', label: 'Helpdesk Tickets', icon: MessageSquare, color: 'bg-pink-500' },
  ];

  // Helper function to check if a role has permission for a specific function and operation
  const hasPermission = (roleKey: string, functionKey: string, operation: 'create' | 'read' | 'update' | 'delete') => {
    const role = APP_CONFIG.roles[roleKey as keyof typeof APP_CONFIG.roles];
    if (!role) return false;

    // Check for wildcard permission
    if (role.permissions.includes('*')) return true;

    // Check specific permissions based on function
    const permissionMap: { [key: string]: { [key: string]: string[] } } = {
      users: {
        create: ['userManagement'],
        read: ['userManagement'],
        update: ['userManagement'],
        delete: ['userManagement']
      },
      projects: {
        create: ['projects:write'],
        read: ['projects:read'],
        update: ['projects:write'],
        delete: ['projects:delete']
      },
      tasks: {
        create: ['tasks:write'],
        read: ['tasks:read'],
        update: ['tasks:write'],
        delete: ['tasks:delete']
      },
      team: {
        create: ['team:write'],
        read: ['team:read'],
        update: ['team:write'],
        delete: ['team:write']
      },
      reports: {
        create: ['reports:read'],
        read: ['reports:read'],
        update: ['reports:read'],
        delete: ['reports:read']
      },
      settings: {
        create: ['systemSettings'],
        read: ['systemSettings'],
        update: ['systemSettings'],
        delete: ['systemSettings']
      },
      security: {
        create: ['systemSettings'],
        read: ['systemSettings'],
        update: ['systemSettings'],
        delete: ['systemSettings']
      },
      database: {
        create: ['systemSettings'],
        read: ['systemSettings'],
        update: ['systemSettings'],
        delete: ['systemSettings']
      },
      helpdesk: {
        create: ['helpdesk:create'],
        read: ['helpdesk:read'],
        update: ['helpdesk:update'],
        delete: ['helpdesk:delete']
      }
    };

    const functionPermissions = permissionMap[functionKey];
    if (!functionPermissions) return false;

    const requiredPermissions = functionPermissions[operation];
    if (!requiredPermissions) return false;

    return requiredPermissions.some(permission => role.permissions.includes(permission));
  };

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

        {/* Comprehensive RBAC Matrix */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Comprehensive RBAC Matrix</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Role / Function</th>
                      {functions.map(func => (
                        <th key={func.key} className="text-center p-2 font-medium">
                          <div className="flex items-center justify-center space-x-1">
                            <div className={`w-3 h-3 rounded ${func.color}`}></div>
                            <span>{func.label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.key} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">
                          <div>
                            <div className="font-semibold">{role.label}</div>
                            <div className="text-xs text-gray-500">Level {role.level}</div>
                          </div>
                        </td>
                        {functions.map(func => (
                          <td key={func.key} className="p-2">
                            <div className="flex justify-center space-x-1">
                              {(['create', 'read', 'update', 'delete'] as const).map(operation => (
                                <div
                                  key={operation}
                                  className={`w-4 h-4 rounded text-xs flex items-center justify-center text-white font-bold ${
                                    hasPermission(role.key, func.key, operation) 
                                      ? 'bg-green-500' 
                                      : 'bg-red-500'
                                  }`}
                                  title={`${operation.toUpperCase()}: ${hasPermission(role.key, func.key, operation) ? 'Allowed' : 'Denied'}`}
                                >
                                  {operation.charAt(0).toUpperCase()}
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span>Allowed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span>Denied</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>C = Create, R = Read, U = Update, D = Delete</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Helpdesk Permission Matrix */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <HelpCircle className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Helpdesk Permission Matrix</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Permission Level</th>
                      <th className="text-center p-2">Read</th>
                      <th className="text-center p-2">Create</th>
                      <th className="text-center p-2">Update</th>
                      <th className="text-center p-2">Delete</th>
                      <th className="text-center p-2">Assign</th>
                      <th className="text-center p-2">Resolve</th>
                      <th className="text-center p-2">Escalate</th>
                      <th className="text-center p-2">Reports</th>
                      <th className="text-center p-2">Admin</th>
                      <th className="text-center p-2">Scope</th>
                      <th className="text-left p-2">Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(helpdeskMatrix).map(([level, config]) => (
                      <tr key={level} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">
                          <div className="capitalize">{level.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.read ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.create ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.update ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.delete ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.assign ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.resolve ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.escalate ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.reports ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <div className={`w-3 h-3 rounded-full mx-auto ${config.permissions.admin ? 'bg-green-500' : 'bg-red-500'}`} />
                        </td>
                        <td className="text-center p-2">
                          <Badge variant="outline" className="text-xs">
                            {config.permissions.departmentScope}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs text-gray-600">
                          {config.roles.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Categories */}
        <div className="space-y-8">
          {Object.entries(roleCategories).map(([category, categoryRoles]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryRoles.map((role) => {
                  const helpdeskPermissions = getHelpdeskPermissionsForRole(role.key);
                  return (
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
                        <div className="space-y-4">
                          {/* General Permissions */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <Shield className="w-4 h-4 mr-1" />
                              General Permissions:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Helpdesk Permissions */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Helpdesk Permissions:
                            </h4>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {Object.entries(helpdeskPermissions).map(([perm, hasPermission]) => (
                                <div key={perm} className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`} />
                                  <span className="capitalize">{perm.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
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
                  );
                })}
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