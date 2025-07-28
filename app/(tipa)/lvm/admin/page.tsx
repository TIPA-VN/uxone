"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  Shield, 
  BarChart3, 
  Database, 
  Plus,
  Activity,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

export default function AdminHomePage() {
  // Mock data - replace with real data from your API
  const stats = {
    totalUsers: 156,
    activeUsers: 142,
    systemAlerts: 2,
    pendingApprovals: 8
  };

  const recentActivities = [
    { id: 1, action: "User created", user: "john.doe", timestamp: "2025-01-27 14:30", status: "completed" },
    { id: 2, action: "Role updated", user: "jane.smith", timestamp: "2025-01-27 13:45", status: "completed" },
    { id: 3, action: "System backup", user: "system", timestamp: "2025-01-27 12:00", status: "completed" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System administration and user management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Admin Department
          </Badge>
          <Button asChild>
            <Link href="/lvm/admin/users/new">
              <Plus className="w-4 h-4 mr-2" />
              New User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.systemAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/admin/users">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage system users and permissions
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/admin/roles">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Role Management</span>
              </CardTitle>
              <CardDescription>
                Configure roles and permissions
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/admin/departments">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-600" />
                <span>Department Codes</span>
              </CardTitle>
              <CardDescription>
                Manage department configurations
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/admin/document-templates">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <span>Document Templates</span>
              </CardTitle>
              <CardDescription>
                Manage document templates
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/admin/system">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-teal-600" />
                <span>System Settings</span>
              </CardTitle>
              <CardDescription>
                Configure system-wide settings
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/admin/audit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gray-600" />
                <span>Audit Logs</span>
              </CardTitle>
              <CardDescription>
                View system audit trails
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activities</CardTitle>
          <CardDescription>
            Latest administrative activities and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500">User: {activity.user}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {activity.status}
                  </Badge>
                  <p className="text-sm text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/lvm/admin/audit">
                View All Activities
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 