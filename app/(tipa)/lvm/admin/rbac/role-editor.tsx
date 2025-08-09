"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Role {
  key: string;
  label: string;
  description: string;
  level: number;
  permissions: string[];
  departmentScope?: string;
  isActive: boolean;
}

interface PermissionGroup {
  name: string;
  permissions: string[];
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const permissionGroups: PermissionGroup[] = [
  {
    name: "User Management",
    permissions: ["userManagement", "userCreation", "userDeletion", "roleAssignment"],
    description: "Manage user accounts and roles",
    icon: Users,
    color: "bg-blue-500"
  },
  {
    name: "Project Management",
    permissions: ["projects:read", "projects:write", "projects:delete", "projectApproval"],
    description: "Create, edit, and manage projects",
    icon: Users, // Changed from FileText to Users as FileText is removed
    color: "bg-green-500"
  },
  {
    name: "Task Management",
    permissions: ["tasks:read", "tasks:write", "tasks:delete", "taskAssignment"],
    description: "Manage tasks and assignments",
    icon: Users, // Changed from Activity to Users as Activity is removed
    color: "bg-purple-500"
  },
  {
    name: "Team Management",
    permissions: ["team:read", "team:write", "team:delete", "teamAssignment"],
    description: "Manage team members and structure",
    icon: Users, // Changed from UserCheck to Users as UserCheck is removed
    color: "bg-orange-500"
  },
  {
    name: "System Settings",
    permissions: ["systemSettings", "systemConfiguration", "systemMaintenance"],
    description: "Configure system settings and maintenance",
    icon: Settings,
    color: "bg-gray-500"
  },
  {
    name: "Security & Access",
    permissions: ["securityManagement", "accessControl", "auditLogs"],
    description: "Manage security and access control",
    icon: Users, // Changed from Lock to Users as Lock is removed
    color: "bg-red-500"
  },
  {
    name: "Database Management",
    permissions: ["databaseAccess", "dataBackup", "dataRestore"],
    description: "Database operations and maintenance",
    icon: Users, // Changed from Database to Users as Database is removed
    color: "bg-teal-500"
  },
  {
    name: "Helpdesk Management",
    permissions: ["helpdesk:read", "helpdesk:create", "helpdesk:update", "helpdesk:delete", "helpdesk:assign", "helpdesk:resolve", "helpdesk:escalate", "helpdesk:reports", "helpdesk:admin"],
    description: "Manage helpdesk tickets and operations",
    icon: Users, // Changed from MessageSquare to Users as MessageSquare is removed
    color: "bg-pink-500"
  },
  {
    name: "Reporting & Analytics",
    permissions: ["reports:read", "reports:write", "analytics:read", "analytics:write"],
    description: "Access to reports and analytics",
    icon: Users, // Changed from FileText to Users as FileText is removed
    color: "bg-indigo-500"
  }
];

const accessLevels = [
  { value: 0, label: "Level 0 - Staff/Operations", description: "Basic access level for staff and operators" },
  { value: 1, label: "Level 1 - Engineering", description: "Engineering and technical staff access" },
  { value: 2, label: "Level 2 - Specialist", description: "Specialist and expert level access" },
  { value: 3, label: "Level 3 - Supervision", description: "Supervisory and team lead access" },
  { value: 4, label: "Level 4 - Management", description: "Management level access" },
  { value: 5, label: "Level 5 - Senior Management", description: "Senior management access" },
  { value: 6, label: "Level 6 - Executive", description: "Executive level access" },
  { value: 7, label: "Level 7 - Senior Executive", description: "Senior executive access" },
  { value: 8, label: "Level 8 - Director", description: "Director level access" },
  { value: 9, label: "Level 9 - Senior Director", description: "Senior director access" },
  { value: 10, label: "Level 10 - General Manager", description: "General manager access" }
];

export default function RoleEditor() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = () => {
    // Initialize with default roles
    const defaultRoles: Role[] = [
      {
        key: "ADMIN",
        label: "Administrator",
        description: "Full system access",
        level: 100,
        permissions: permissionGroups.flatMap(group => group.permissions),
        departmentScope: "all",
        isActive: true
      },
      {
        key: "MANAGER",
        label: "Manager",
        description: "Department management access",
        level: 80,
        permissions: ["projects:read", "projects:write", "tasks:read", "tasks:write", "team:read"],
        departmentScope: "own",
        isActive: true
      },
      {
        key: "USER",
        label: "User",
        description: "Basic user access",
        level: 50,
        permissions: ["projects:read", "tasks:read", "tasks:write"],
        departmentScope: "own",
        isActive: true
      }
    ];
    setRoles(defaultRoles);
  };

  const handleCreateRole = () => {
    const newRole: Role = {
      key: "",
      label: "",
      description: "",
      level: 0,
      permissions: [],
      departmentScope: "own",
      isActive: true
    };
    setEditingRole(newRole);
    setIsCreating(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role });
    setIsCreating(false);
  };

  const handleDeleteRole = (roleKey: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleKey}"?`)) {
      setRoles(prev => prev.filter(r => r.key !== roleKey));
      toast.success("Role deleted successfully");
    }
  };

  const handleSaveRole = () => {
    if (!editingRole || !editingRole.key.trim() || !editingRole.label.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Validate permissions
      const validPermissions = editingRole.permissions.filter(p => 
        permissionGroups.some(group => group.permissions.includes(p))
      );

      if (validPermissions.length !== editingRole.permissions.length) {
        toast.warning("Some permissions were invalid and have been removed");
        editingRole.permissions = validPermissions;
      }

      // Save role logic here
      if (isCreating) {
        // Create new role
        const newRole: Role = {
          ...editingRole,
          key: editingRole.key.toUpperCase().replace(/\s+/g, '_'),
          isActive: true
        };
        
        // Add to roles list
        setRoles(prev => [...prev, newRole]);
        toast.success("Role created successfully");
      } else {
        // Update existing role
        setRoles(prev => prev.map(r => r.key === editingRole.key ? editingRole : r));
        toast.success("Role updated successfully");
      }

      // Reset form
      setEditingRole(null);
      setIsCreating(false);
    } catch (error) {
      toast.error("Failed to save role");
      console.error("Save role error:", error);
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setIsCreating(false);
  };

  const togglePermission = (permission: string) => {
    if (!editingRole) return;

    const newPermissions = editingRole.permissions.includes(permission)
      ? editingRole.permissions.filter(p => p !== permission)
      : [...editingRole.permissions, permission];

    setEditingRole({
      ...editingRole,
      permissions: newPermissions
    });
  };

  const toggleAllPermissions = (group: PermissionGroup, enabled: boolean) => {
    if (!editingRole) return;

    const newPermissions = enabled
      ? [...new Set([...editingRole.permissions, ...group.permissions])]
      : editingRole.permissions.filter(p => !group.permissions.includes(p));

    setEditingRole({
      ...editingRole,
      permissions: newPermissions
    });
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || role.level === selectedLevel;
    const matchesActive = showInactive || role.isActive;
    
    return matchesSearch && matchesLevel && matchesActive;
  });

  const getPermissionCount = (role: Role) => {
    return role.permissions.length;
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-sm text-gray-600">
            Create, edit, and manage role-based access control
          </p>
        </div>
        <Button onClick={handleCreateRole} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Roles
              </CardTitle>
              <CardDescription>
                {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={selectedLevel.toString()} onValueChange={(value) => setSelectedLevel(value === "all" ? "all" : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {accessLevels.map(level => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showInactive"
                    checked={showInactive}
                    onCheckedChange={(checked) => setShowInactive(checked as boolean)}
                  />
                  <Label htmlFor="showInactive">Show inactive roles</Label>
                </div>
              </div>

              {/* Role List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRoles.map((role) => (
                  <div
                    key={role.key}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      editingRole?.key === role.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setEditingRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{role.label}</div>
                        <div className="text-xs text-gray-500">{role.key}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Level {role.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getPermissionCount(role)} permissions
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.key);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Editor */}
        <div className="lg:col-span-2">
          {editingRole ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {isCreating ? (
                    <Plus className="w-5 h-5 mr-2" />
                  ) : (
                    <Edit className="w-5 h-5 mr-2" />
                  )}
                  {isCreating ? "Create New Role" : `Edit Role: ${editingRole.label}`}
                </CardTitle>
                <CardDescription>
                  {isCreating ? "Define a new role with specific permissions" : "Modify role permissions and settings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleKey">Role Key *</Label>
                    <Input
                      id="roleKey"
                      value={editingRole.key}
                      onChange={(e) => setEditingRole({ ...editingRole, key: e.target.value })}
                      placeholder="e.g., SENIOR_MANAGER"
                      disabled={!isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleLabel">Role Label *</Label>
                    <Input
                      id="roleLabel"
                      value={editingRole.label}
                      onChange={(e) => setEditingRole({ ...editingRole, label: e.target.value })}
                      placeholder="e.g., Senior Manager"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    placeholder="Describe the role's responsibilities and scope"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleLevel">Access Level</Label>
                    <Select value={editingRole.level.toString()} onValueChange={(value) => setEditingRole({ ...editingRole, level: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accessLevels.map(level => (
                          <SelectItem key={level.value} value={level.value.toString()}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentScope">Department Scope</Label>
                    <Select value={editingRole.departmentScope || "own"} onValueChange={(value) => setEditingRole({ ...editingRole, departmentScope: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="own">Own Department</SelectItem>
                        <SelectItem value="related">Related Departments</SelectItem>
                        <SelectItem value="all">All Departments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Permissions</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allPermissions = permissionGroups.flatMap(g => g.permissions);
                          setEditingRole({ ...editingRole, permissions: allPermissions });
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRole({ ...editingRole, permissions: [] })}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="groups" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="groups">By Groups</TabsTrigger>
                      <TabsTrigger value="list">All Permissions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="groups" className="space-y-4">
                      {permissionGroups.map((group) => {
                        const groupPermissions = group.permissions;
                        const selectedCount = groupPermissions.filter(p => editingRole.permissions.includes(p)).length;
                        const isAllSelected = selectedCount === groupPermissions.length;
                        const isPartiallySelected = selectedCount > 0 && selectedCount < groupPermissions.length;

                        return (
                          <Card key={group.name} className="border-l-4 border-l-gray-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`p-2 rounded ${group.color} text-white`}>
                                    <group.icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-sm">{group.name}</CardTitle>
                                    <CardDescription className="text-xs">{group.description}</CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={isAllSelected}
                                    ref={(ref) => {
                                      if (ref && 'indeterminate' in ref) {
                                        (ref as HTMLInputElement).indeterminate = isPartiallySelected;
                                      }
                                    }}
                                    onCheckedChange={(checked) => toggleAllPermissions(group, checked as boolean)}
                                  />
                                  <span className="text-xs text-gray-500">
                                    {selectedCount}/{groupPermissions.length}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {groupPermissions.map((permission) => (
                                  <div key={permission} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={permission}
                                      checked={editingRole.permissions.includes(permission)}
                                      onCheckedChange={() => togglePermission(permission)}
                                    />
                                    <Label htmlFor={permission} className="text-xs cursor-pointer">
                                      {permission}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </TabsContent>

                    <TabsContent value="list" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {permissionGroups.flatMap(g => g.permissions).map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={editingRole.permissions.includes(permission)}
                              onCheckedChange={() => togglePermission(permission)}
                            />
                            <Label htmlFor={permission} className="text-xs cursor-pointer">
                              {permission}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRole} className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    {isCreating ? "Create Role" : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Role Selected</h3>
                <p className="text-gray-500 mb-4">
                  Select a role from the list to edit, or create a new role to get started.
                </p>
                <Button onClick={handleCreateRole} className="flex items-center mx-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Role
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
