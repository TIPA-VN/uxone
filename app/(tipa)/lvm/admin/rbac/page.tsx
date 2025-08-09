import { auth } from "@/lib/auth";
import { canAccessPage } from "@/config/app";
import { redirect } from "next/navigation";
import { APP_CONFIG, getHelpdeskPermissionMatrix, getHelpdeskPermissionLevel } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  MessageSquare, 
  Database, 
  FileText, 
  UserCheck, 
  Lock,
  Eye,
  CheckCircle,
  Info
} from "lucide-react";
import Link from "next/link";

export default async function RBACPage() {
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
    { key: 'users', label: 'Users', icon: Users, color: 'bg-blue-500', description: 'User account management' },
    { key: 'projects', label: 'Projects', icon: FileText, color: 'bg-green-500', description: 'Project creation and management' },
    { key: 'tasks', label: 'Tasks', icon: Activity, color: 'bg-purple-500', description: 'Task assignment and tracking' },
    { key: 'team', label: 'Team', icon: UserCheck, color: 'bg-orange-500', description: 'Team member management' },
    { key: 'reports', label: 'Reports', icon: FileText, color: 'bg-indigo-500', description: 'Analytics and reporting' },
    { key: 'settings', label: 'Settings', icon: Settings, color: 'bg-gray-500', description: 'System configuration' },
    { key: 'security', label: 'Security', icon: Lock, color: 'bg-red-500', description: 'Security and access control' },
    { key: 'database', label: 'Database', icon: Database, color: 'bg-teal-500', description: 'Database management' },
    { key: 'helpdesk', label: 'Helpdesk', icon: MessageSquare, color: 'bg-pink-500', description: 'Support ticket management' },
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

  // Calculate statistics
  const totalRoles = roles.length;
  const totalPermissions = new Set(roles.flatMap(r => r.permissions)).size;
  const accessLevels = new Set(roles.map(r => r.level)).size;
  const adminRoles = roles.filter(r => r.permissions.includes('*')).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RBAC Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Comprehensive Role-Based Access Control management system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/admin/roles">
                  <Shield className="w-4 h-4 mr-2" />
                  View Roles
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/users">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRoles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500 text-white">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Permission Types</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPermissions}</p>
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
                  <p className="text-sm font-medium text-gray-600">Access Levels</p>
                  <p className="text-2xl font-bold text-gray-900">{accessLevels}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500 text-white">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admin Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{adminRoles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
            <TabsTrigger value="helpdesk">Helpdesk RBAC</TabsTrigger>
            <TabsTrigger value="roles">Role Categories</TabsTrigger>
            <TabsTrigger value="audit">Permissions Audit</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  RBAC System Overview
                </CardTitle>
                <CardDescription>
                  Understanding the Role-Based Access Control system structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">System Architecture</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Hierarchical role system with 11 access levels
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Granular permission-based access control
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Department-based access restrictions
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Feature and page-level access control
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Features</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Comprehensive permission matrix
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Helpdesk-specific RBAC rules
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        API endpoint protection
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Real-time access validation
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/roles">
                        <Eye className="w-4 h-4 mr-2" />
                        View All Roles
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/users">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/departments">
                        <Settings className="w-4 h-4 mr-2" />
                        Department Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Matrix Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Comprehensive Permissions Matrix
                </CardTitle>
                <CardDescription>
                  Detailed view of role permissions across all system functions
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                            <div className="text-xs text-gray-500 mt-1">{func.description}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.slice(0, 15).map((role) => (
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
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/admin/roles">
                      View Complete Matrix
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Helpdesk RBAC Tab */}
          <TabsContent value="helpdesk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Helpdesk Permission Matrix
                </CardTitle>
                <CardDescription>
                  Specialized RBAC rules for helpdesk ticket management
                </CardDescription>
              </CardHeader>
              <CardContent>
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
          </TabsContent>

          {/* Role Categories Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className="space-y-8">
              {Object.entries(roleCategories).map(([category, categoryRoles]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-xl">{category}</CardTitle>
                    <CardDescription>
                      {categoryRoles.length} role{categoryRoles.length !== 1 ? 's' : ''} in this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryRoles.slice(0, 6).map((role) => {
                        return (
                          <div key={role.key} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">{role.label}</h4>
                              <Badge variant="secondary" className="text-xs">
                                Level {role.level}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{role.description}</p>
                            
                            <div className="space-y-2">
                              <div className="text-xs">
                                <span className="font-medium">Permissions:</span> {role.permissions.length}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">Helpdesk Level:</span> {getHelpdeskPermissionLevel(role.key)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {categoryRoles.length > 6 && (
                      <div className="mt-4 text-center">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/admin/roles">
                            View All {category} Roles
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Permissions Audit Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Permissions Audit
                </CardTitle>
                <CardDescription>
                  Comprehensive analysis of role-based access control and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Permissions Audit Component</h3>
                  <p className="text-gray-500 mb-4">
                    This component provides detailed permission analysis, risk assessment, and security insights.
                  </p>
                  <Button asChild>
                    <Link href="/admin/rbac/permissions-audit">
                      <Shield className="w-4 h-4 mr-2" />
                      Open Permissions Audit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
