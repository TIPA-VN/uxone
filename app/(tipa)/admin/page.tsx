"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  UserCheck,
  Calendar,
  Filter,
  Shield
} from "lucide-react";
import { APP_CONFIG, canAccessPage } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { useUsers } from "@/hooks/useUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useActivities } from "@/hooks/useActivities";

// Define the permission structure
type Permission = 'C' | 'R' | 'U' | 'D';

interface RolePermissions {
  [role: string]: {
    [func: string]: {
      C: boolean;
      R: boolean;
      U: boolean;
      D: boolean;
    };
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  
  // User management hook
  const {
    users,
    loading: usersLoading,
    error: usersError,
    pagination,
    searchTerm: userSearchTerm,
    statusFilter,
    setSearchTerm: setUserSearchTerm,
    setStatusFilter,
    setPage,
    toggleUserStatus,
    refreshUsers,
  } = useUsers();

  // Departments hook
  const {
    departments,
    loading: departmentsLoading,
    error: departmentsError,
    totalDepartments,
    totalUsers,
  } = useDepartments();

  // Activities hook
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
  } = useActivities(10);

  // Initialize permissions for all roles from APP_CONFIG
  const initialPermissions: RolePermissions = {};
  
  // Create permissions for all roles
  Object.keys(APP_CONFIG.roles).forEach(roleKey => {
    initialPermissions[roleKey] = {
      Users: { C: false, R: false, U: false, D: false },
      Projects: { C: false, R: false, U: false, D: false },
      Tasks: { C: false, R: false, U: false, D: false },
      Team: { C: false, R: false, U: false, D: false },
      Reports: { C: false, R: false, U: false, D: false },
      Settings: { C: false, R: false, U: false, D: false },
      Security: { C: false, R: false, U: false, D: false },
      Database: { C: false, R: false, U: false, D: false },
      Helpdesk: { C: false, R: false, U: false, D: false },
    };
  });

  // Set default permissions based on role hierarchy
  const setDefaultPermissions = () => {
    const defaults: RolePermissions = { ...initialPermissions };
    
    // ADMIN - Full access
    defaults.ADMIN = {
      Users: { C: true, R: true, U: true, D: true },
      Projects: { C: true, R: true, U: true, D: true },
      Tasks: { C: true, R: true, U: true, D: true },
      Team: { C: true, R: true, U: true, D: true },
      Reports: { C: true, R: true, U: true, D: true },
      Settings: { C: true, R: true, U: true, D: true },
      Security: { C: true, R: true, U: true, D: true },
      Database: { C: true, R: true, U: true, D: true },
      Helpdesk: { C: true, R: true, U: true, D: true },
    };

    // Executive Level
    const executiveRoles = ['GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2'];
    executiveRoles.forEach(role => {
      defaults[role] = {
        Users: { C: true, R: true, U: true, D: false },
        Projects: { C: true, R: true, U: true, D: true },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: true, R: true, U: true, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: true, U: false, D: false },
        Security: { C: false, R: true, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: true },
      };
    });

    // Senior Management
    const seniorManagementRoles = ['SENIOR_MANAGER', 'SENIOR_MANAGER_2', 'ASSISTANT_SENIOR_MANAGER'];
    seniorManagementRoles.forEach(role => {
      defaults[role] = {
        Users: { C: false, R: true, U: false, D: false },
        Projects: { C: true, R: true, U: true, D: false },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: true, R: true, U: false, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: false, U: false, D: false },
        Security: { C: false, R: false, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: true },
      };
    });

    // Management
    const managementRoles = ['MANAGER', 'MANAGER_2', 'ASSISTANT_MANAGER', 'ASSISTANT_MANAGER_2'];
    managementRoles.forEach(role => {
      defaults[role] = {
        Users: { C: false, R: false, U: false, D: false },
        Projects: { C: true, R: true, U: true, D: false },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: false, R: true, U: false, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: false, U: false, D: false },
        Security: { C: false, R: false, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: false },
      };
    });

    // Supervision
    const supervisionRoles = ['SUPERVISOR', 'SUPERVISOR_2', 'LINE_LEADER'];
    supervisionRoles.forEach(role => {
      defaults[role] = {
        Users: { C: false, R: false, U: false, D: false },
        Projects: { C: false, R: true, U: false, D: false },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: false, R: true, U: false, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: false, U: false, D: false },
        Security: { C: false, R: false, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: false },
      };
    });

    // Technical Specialists
    const technicalRoles = ['CHIEF_SPECIALIST', 'SENIOR_SPECIALIST', 'SENIOR_SPECIALIST_2', 'TECHNICAL_SPECIALIST', 'SPECIALIST', 'SPECIALIST_2', 'SENIOR_ENGINEER', 'ENGINEER'];
    technicalRoles.forEach(role => {
      defaults[role] = {
        Users: { C: false, R: false, U: false, D: false },
        Projects: { C: false, R: true, U: false, D: false },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: false, R: true, U: false, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: false, U: false, D: false },
        Security: { C: false, R: false, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: false },
      };
    });

    // Staff Level
    const staffRoles = ['SENIOR_STAFF', 'STAFF', 'SENIOR_ASSOCIATE', 'ASSOCIATE'];
    staffRoles.forEach(role => {
      defaults[role] = {
        Users: { C: false, R: false, U: false, D: false },
        Projects: { C: false, R: true, U: false, D: false },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: false, R: true, U: false, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: false, U: false, D: false },
        Security: { C: false, R: false, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: false },
      };
    });

    // Operations
    const operationsRoles = ['SENIOR_OPERATOR', 'OPERATOR', 'TECHNICIAN'];
    operationsRoles.forEach(role => {
      defaults[role] = {
        Users: { C: false, R: false, U: false, D: false },
        Projects: { C: false, R: true, U: false, D: false },
        Tasks: { C: true, R: true, U: true, D: false },
        Team: { C: false, R: true, U: false, D: false },
        Reports: { C: false, R: true, U: false, D: false },
        Settings: { C: false, R: false, U: false, D: false },
        Security: { C: false, R: false, U: false, D: false },
        Database: { C: false, R: false, U: false, D: false },
        Helpdesk: { C: true, R: true, U: true, D: false },
      };
    });

    // Entry Level
    defaults.INTERN = {
      Users: { C: false, R: false, U: false, D: false },
      Projects: { C: false, R: true, U: false, D: false },
      Tasks: { C: false, R: true, U: false, D: false },
      Team: { C: false, R: true, U: false, D: false },
      Reports: { C: false, R: false, U: false, D: false },
      Settings: { C: false, R: false, U: false, D: false },
      Security: { C: false, R: false, U: false, D: false },
      Database: { C: false, R: false, U: false, D: false },
      Helpdesk: { C: true, R: true, U: false, D: false },
    };

    return defaults;
  };

  const [permissions, setPermissions] = useState<RolePermissions>(setDefaultPermissions());

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = session.user.role as keyof typeof APP_CONFIG.roles;

  if (!canAccessPage(userRole, 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockUsers = [
    { id: 1, name: "John Doe", username: "john.doe", role: "SENIOR MANAGER", department: "IT", status: "active" },
    { id: 2, name: "Jane Smith", username: "jane.smith", role: "MANAGER", department: "HR", status: "active" },
    { id: 3, name: "Bob Wilson", username: "bob.wilson", role: "ENGINEER", department: "Engineering", status: "inactive" },
  ];

  const mockRoles = Object.entries(APP_CONFIG.roles).slice(0, 10).map(([key, role]) => ({
    key,
    ...role
  }));

  const mockDepartments = APP_CONFIG.departments.slice(0, 6);

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "User Management", icon: Users },
    { id: "roles", label: "Role Management", icon: UserCheck },
    { id: "departments", label: "Departments", icon: Calendar },
    { id: "settings", label: "System Settings", icon: Settings },
  ];



  // Handle permission change
  const handlePermissionChange = (role: string, func: string, permission: Permission, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [func]: {
          ...(prev[role] as RolePermissions[string])[func],
          [permission]: value
        }
      }
    }));
  };

  // Save permissions
  const handleSavePermissions = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically save to your backend
      console.log('Saving permissions:', permissions);
      
      setSaveMessage("Permissions saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save permissions. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm("Are you sure you want to reset all permissions to default values?")) {
      setPermissions(setDefaultPermissions());
    }
  };

  // Export permissions
  const handleExportPermissions = () => {
    const dataStr = JSON.stringify(permissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'role-permissions.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get role color and icon
  const getRoleStyle = (role: string) => {
    switch (role) {
      // Admin
      case 'ADMIN':
        return { color: 'blue', icon: Users, bgColor: 'bg-blue-50', textColor: 'text-blue-900' };
      
      // Executive Level
      case 'GENERAL_DIRECTOR':
      case 'GENERAL_MANAGER':
      case 'ASSISTANT_GENERAL_MANAGER':
      case 'ASSISTANT_GENERAL_MANAGER_2':
        return { color: 'green', icon: Users, bgColor: 'bg-white', textColor: 'text-gray-900' };
      
      // Senior Management
      case 'SENIOR_MANAGER':
      case 'SENIOR_MANAGER_2':
      case 'ASSISTANT_SENIOR_MANAGER':
        return { color: 'purple', icon: Users, bgColor: 'bg-gray-50', textColor: 'text-gray-900' };
      
      // Management
      case 'MANAGER':
      case 'MANAGER_2':
      case 'ASSISTANT_MANAGER':
      case 'ASSISTANT_MANAGER_2':
        return { color: 'orange', icon: UserCheck, bgColor: 'bg-white', textColor: 'text-gray-900' };
      
      // Supervision
      case 'SUPERVISOR':
      case 'SUPERVISOR_2':
      case 'LINE_LEADER':
        return { color: 'yellow', icon: UserCheck, bgColor: 'bg-gray-50', textColor: 'text-gray-900' };
      
      // Technical Specialists
      case 'CHIEF_SPECIALIST':
      case 'SENIOR_SPECIALIST':
      case 'SENIOR_SPECIALIST_2':
      case 'TECHNICAL_SPECIALIST':
      case 'SPECIALIST':
      case 'SPECIALIST_2':
      case 'SENIOR_ENGINEER':
      case 'ENGINEER':
        return { color: 'indigo', icon: Settings, bgColor: 'bg-white', textColor: 'text-gray-900' };
      
      // Staff Level
      case 'SENIOR_STAFF':
      case 'STAFF':
      case 'SENIOR_ASSOCIATE':
      case 'ASSOCIATE':
        return { color: 'gray', icon: Users, bgColor: 'bg-gray-50', textColor: 'text-gray-900' };
      
      // Operations
      case 'SENIOR_OPERATOR':
      case 'OPERATOR':
      case 'TECHNICIAN':
        return { color: 'red', icon: Activity, bgColor: 'bg-white', textColor: 'text-gray-900' };
      
      // Entry Level
      case 'INTERN':
        return { color: 'pink', icon: Users, bgColor: 'bg-gray-50', textColor: 'text-gray-900' };
      
      default:
        return { color: 'gray', icon: Users, bgColor: 'bg-white', textColor: 'text-gray-900' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                System administration and management tools
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Role:</span> {APP_CONFIG.roles[userRole]?.label || userRole}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">User:</span> {session.user.name}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="inline w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-blue-500 text-white">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{mockUsers.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-green-500 text-white">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">{mockUsers.filter(u => u.status === 'active').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-orange-500 text-white">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Departments</p>
                        <p className="text-2xl font-bold text-gray-900">{mockDepartments.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-purple-500 text-white">
                        <Settings className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Roles</p>
                        <p className="text-2xl font-bold text-gray-900">{mockRoles.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system activities and changes</CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 text-sm">Loading activities...</span>
                    </div>
                  ) : activitiesError ? (
                    <div className="text-sm text-red-600">
                      {activitiesError}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No recent activities
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const getTimeAgo = (timestamp: string) => {
                          const now = new Date();
                          const activityTime = new Date(timestamp);
                          const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
                          
                          if (diffInMinutes < 1) return 'Just now';
                          if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
                          if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
                          return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
                        };

                        const getColor = (color: string) => {
                          switch (color) {
                            case 'green': return 'bg-green-500';
                            case 'blue': return 'bg-blue-500';
                            case 'orange': return 'bg-orange-500';
                            case 'red': return 'bg-red-500';
                            default: return 'bg-gray-500';
                          }
                        };

                        return (
                          <div key={activity.id} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 ${getColor(activity.color)} rounded-full`}></div>
                            <div className="flex-1">
                              <span className="text-sm text-gray-600">{activity.message}</span>
                              {activity.details && (
                                <span className="text-xs text-gray-400 ml-1">({activity.details})</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{getTimeAgo(activity.timestamp)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              {/* Compact Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <div className="text-sm text-gray-600">
                  {pagination && (
                    <span>Total: {pagination.totalUsers}</span>
                  )}
                </div>
              </div>

              {/* Compact Search and Filter */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Error Message */}
              {usersError && (
                <div className="mb-3 p-2 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm">
                  {usersError}
                </div>
              )}

              {/* Compact Users Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersLoading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600 text-sm">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-center text-gray-500 text-sm">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <div>
                                  <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
                                  <div className="text-gray-500 text-xs">{user.username}</div>
                                  {user.email && (
                                    <div className="text-gray-400 text-xs truncate max-w-[200px]">{user.email}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className="text-xs">{user.role || 'N/A'}</Badge>
                              </td>
                              <td className="px-4 py-2 text-gray-900 text-sm">
                                {user.departmentName || user.department || 'N/A'}
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <Button
                                  variant={user.isActive ? "destructive" : "default"}
                                  size="sm"
                                  onClick={async () => {
                                    const success = await toggleUserStatus(user.id, !user.isActive);
                                    if (success) {
                                      refreshUsers();
                                    }
                                  }}
                                  disabled={usersLoading}
                                  className="h-7 px-2 text-xs"
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Enable
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Compact Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="px-4 py-2 border-t border-gray-200">
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={setPage}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "roles" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Role Management</h2>
              
              {/* Save Message */}
              {saveMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  saveMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {saveMessage}
                </div>
              )}
              
              {/* Role Permissions Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Permissions Matrix</CardTitle>
                  <CardDescription>
                    Manage CRUD permissions for each role across all system functions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-10 min-w-[200px]">
                            Role / Function
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Users</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Projects</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Tasks</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Team</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Reports</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Settings</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Security</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Database</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <div className="flex flex-col items-center">
                              <span>Helpdesk</span>
                              <span className="text-xs text-gray-400">C/R/U/D</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(permissions).map(([role, functions]) => {
                          const style = getRoleStyle(role);
                          const IconComponent = style.icon;
                          const roleConfig = APP_CONFIG.roles[role as keyof typeof APP_CONFIG.roles];
                          const roleLabel = roleConfig?.label || role;
                          
                          return (
                            <tr key={role} className={style.bgColor}>
                              <td className={`px-4 py-3 text-sm font-medium ${style.textColor} sticky left-0 z-10 ${style.bgColor}`}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className={`h-4 w-4 text-${style.color}-600`} />
                                  <div>
                                    <span className="font-medium">{roleLabel}</span>
                                    <div className="text-xs text-gray-500">{role}</div>
                                  </div>
                                </div>
                              </td>
                              {Object.entries(functions).map(([func, perms]) => (
                                <td key={func} className="px-4 py-3 text-center">
                                  <div className="flex justify-center space-x-1">
                                    {(['C', 'R', 'U', 'D'] as Permission[]).map((perm) => (
                                      <input
                                        key={perm}
                                        type="checkbox"
                                        checked={(perms as RolePermissions[string][string])[perm]}
                                        onChange={(e) => handlePermissionChange(role, func, perm, e.target.checked)}
                                        className={`w-3 h-3 text-${style.color}-600 border-gray-300 rounded focus:ring-${style.color}-500`}
                                      />
                                    ))}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Permission Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>C - Create</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>R - Read</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>U - Update</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>D - Delete</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between">
                <div className="flex space-x-3">
                  <button 
                    onClick={handleResetToDefault}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Reset to Default
                  </button>
                  <button 
                    onClick={handleExportPermissions}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Export Permissions
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePermissions}
                    disabled={isSaving}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isSaving ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "departments" && (
            <div>
              {/* Compact Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Department Management</h2>
                <div className="text-sm text-gray-600">
                  <span>Total: {totalDepartments}</span>
                </div>
              </div>

              {/* Error Message */}
              {departmentsError && (
                <div className="mb-3 p-2 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm">
                  {departmentsError}
                </div>
              )}

              {/* Compact Departments Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Key</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departmentsLoading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600 text-sm">Loading departments...</span>
                              </div>
                            </td>
                          </tr>
                        ) : departments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-center text-gray-500 text-sm">
                              No departments found
                            </td>
                          </tr>
                        ) : (
                          departments.map((dept) => (
                            <tr key={dept.value} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                                  <div>
                                    <div className="font-medium text-gray-900">{dept.label}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                  {dept.value}
                                </code>
                              </td>
                              <td className="px-4 py-2 text-gray-600 text-sm">
                                {dept.description}
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className="text-xs">
                                  {dept.userCount} users
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                  Active
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Department Statistics */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-600">Total Departments</p>
                      <p className="text-lg font-bold text-gray-900">{totalDepartments}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-green-600" />
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-600">Total Users</p>
                      <p className="text-lg font-bold text-gray-900">{totalUsers}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-blue-500 rounded"></div>
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-600">Active</p>
                      <p className="text-lg font-bold text-gray-900">{totalDepartments}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Settings className="h-6 w-6 text-blue-600" />
                      <CardTitle>General Settings</CardTitle>
                    </div>
                    <CardDescription>
                      Basic application configuration and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Name
                      </label>
                      <input
                        type="text"
                        defaultValue={APP_CONFIG.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Language
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="en">English</option>
                        <option value="th">Thai</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Zone
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-red-600" />
                      <CardTitle>Security Settings</CardTitle>
                    </div>
                    <CardDescription>
                      Security policies and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        min="5"
                        max="480"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Policy
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="standard">Standard (8+ characters)</option>
                        <option value="strong">Strong (12+ characters, special chars)</option>
                        <option value="enterprise">Enterprise (16+ characters, complex)</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="mfa"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="mfa" className="text-sm font-medium text-gray-700">
                        Enable Multi-Factor Authentication
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Save All Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 