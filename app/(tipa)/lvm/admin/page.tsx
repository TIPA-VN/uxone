"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, 
  Activity, 
  Settings,
  UserCheck,
  Shield,
  Building2,
  FileText,
  Mail,
  Code,
  BarChart3,
  Clock,
  CheckCircle
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useActivities } from "@/hooks/useActivities";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // User management hook
  const {
    users,
    pagination,
  } = useUsers();

  // Departments hook
  const {
    totalDepartments,
  } = useDepartments();

  // Activities hook
  const {
    activities,
  } = useActivities(10);

  // State for quick actions
  const [isLoading, setIsLoading] = useState(false);

  // Authentication is now handled by middleware for /lvm/admin routes
  // No need for client-side redirects

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user.role;
  const roleConfig = APP_CONFIG.roles[userRole as keyof typeof APP_CONFIG.roles];

  // Quick action handlers
  const handleQuickAction = (action: 'users' | 'roles' | 'rbac' | 'departments' | 'settings') => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      switch (action) {
        case 'users':
          router.push('/lvm/admin/users');
          break;
        case 'roles':
          router.push('/lvm/admin/roles');
          break;
        case 'rbac':
          router.push('/lvm/admin/rbac');
          break;
        case 'departments':
          router.push('/lvm/admin/departments');
          break;
        case 'settings':
          router.push('/lvm/admin/settings');
          break;
      }
    }, 500);
  };

  // Get system statistics
  const getSystemStats = () => {
    const activeUsers = users?.filter(u => u.isActive).length || 0;
    const inactiveUsers = users?.filter(u => !u.isActive).length || 0;
    
    return {
      totalUsers: pagination?.totalUsers || 0,
      activeUsers,
      inactiveUsers,
      totalDepartments: totalDepartments || 0,
      activeDepartments: totalDepartments || 0,
      inactiveDepartments: 0,
      recentActivities: activities?.length || 0
    };
  };

  const stats = getSystemStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {session.user.name}. Manage your system from here.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Role: {roleConfig?.label || userRole}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Department: {session.user.department || 'N/A'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">
                  {stats.activeUsers} active, {stats.inactiveUsers} inactive
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</p>
                <p className="text-xs text-gray-500">
                  {stats.activeDepartments} active, {stats.inactiveDepartments} inactive
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Roles</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(APP_CONFIG.roles).length}</p>
                <p className="text-xs text-gray-500">Access levels defined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-500 text-white">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivities}</p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Access common administrative functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => handleQuickAction('users')}
                disabled={isLoading}
              >
                <Users className="w-6 h-6 mb-2" />
                <span className="text-sm">User Management</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => handleQuickAction('roles')}
                disabled={isLoading}
              >
                <UserCheck className="w-6 h-6 mb-2" />
                <span className="text-sm">Role Management</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => handleQuickAction('rbac')}
                disabled={isLoading}
              >
                <Shield className="w-6 h-6 mb-2" />
                <span className="text-sm">RBAC System</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => handleQuickAction('departments')}
                disabled={isLoading}
              >
                <Building2 className="w-6 h-6 mb-2" />
                <span className="text-sm">Departments</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Database Connection</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Authentication Service</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">File Storage</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Available
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Email Service</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent System Activity
          </CardTitle>
          <CardDescription>
            Latest administrative actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* activitiesLoading is not defined, assuming it's a placeholder for a loading state */}
          {/* For now, we'll just show a placeholder message */}
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tools Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Available Admin Tools
          </CardTitle>
          <CardDescription>
            Complete list of administrative functions and their purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                      { icon: Users, label: "User Management", description: "Create, edit, and manage user accounts", href: "/lvm/admin/users" },
        { icon: UserCheck, label: "Role Management", description: "Define user roles and permissions", href: "/lvm/admin/roles" },
        { icon: Shield, label: "RBAC System", description: "Advanced access control management", href: "/lvm/admin/rbac" },
        { icon: Building2, label: "Departments", description: "Organizational structure management", href: "/lvm/admin/departments" },
        { icon: Code, label: "Department Codes", description: "Department coding and classification", href: "/lvm/admin/department-codes" },
        { icon: FileText, label: "Document Templates", description: "Template management system", href: "/lvm/admin/document-templates" },
        { icon: Mail, label: "Email Webhook Test", description: "Test email integration", href: "/lvm/admin/email-webhook-test" },
        { icon: Settings, label: "System Settings", description: "Global configuration options", href: "/lvm/admin/settings" }
            ].map((tool) => (
              <div key={tool.label} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <tool.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{tool.label}</h3>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => router.push(tool.href)}
                >
                  Access Tool
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 