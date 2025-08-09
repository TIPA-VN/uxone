"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Users, 
  Settings, 
  // Eye,
  // EyeOff,
  // Check,
  // X,
  // AlertTriangle,
  Lock,
  // Unlock,
  Hash,
  Calendar,
  FileText,
  Save,
  Loader2
} from "lucide-react";
import { APP_CONFIG } from "@/config/app";

interface TicketNumberingConfig {
  emailPrefix: string;
  manualPrefix: string;
  emailSequencePadding: number;
  manualSequencePadding: number;
}

// interface RBACMatrixProps {
//   userRole: string;
// }
// 
// // function RBACMatrix({ userRole }: RBACMatrixProps) {
//   const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
// 
//   const toggleRole = (role: string) => {
//     setExpandedRoles(prev => 
//       prev.includes(role) 
//         ? prev.filter(r => r !== role)
//         : [...prev, role]
//     );
//   };
// 
//   const getPermissionIcon = (hasPermission: boolean) => {
//     return hasPermission ? (
//       <Check className="w-4 h-4 text-green-600" />
//     ) : (
//       <X className="w-4 h-4 text-red-600" />
//     );
//   };
// 
//   const getPermissionBadge = (hasPermission: boolean) => {
//     return hasPermission ? (
//       <Badge className="bg-green-100 text-green-800 border-green-200">Allowed</Badge>
//     ) : (
//       <Badge variant="outline" className="text-red-600 border-red-200">Denied</Badge>
//     );
//   };
// 
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Shield className="w-5 h-5 text-blue-600" />
//           Role-Based Access Control (RBAC) Matrix
//         </CardTitle>
//         <CardDescription>
//           Comprehensive view of permissions and access levels across all roles
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4">
//           {/* Features Matrix */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3 text-gray-900">Feature Access Matrix</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse border border-gray-200">
//                 <thead>
//                   <tr className="bg-gray-50">
//                     <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Role</th>
//                     {Object.keys(APP_CONFIG.rbac.features).map(feature => (
//                       <th key={feature} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
//                         {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Object.values(getRoles()).map((role: any) => (
//                     <tr key={role.value} className="hover:bg-gray-50">
//                       <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">
//                         {role.label}
//                       </td>
//                       {Object.keys(APP_CONFIG.rbac.features).map(feature => {
//                         const featureConfig = APP_CONFIG.rbac.features[feature as keyof typeof APP_CONFIG.rbac.features];
//                         const hasAccess = featureConfig.roles.includes(role.value as any);
//                         return (
//                           <td key={feature} className="border border-gray-200 px-4 py-2 text-center">
//                             {getPermissionIcon(hasAccess)}
//                           </td>
//                         );
//                       })}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
// 
//           {/* Page Access Matrix */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3 text-gray-900">Page Access Matrix</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse border border-gray-200">
//                 <thead>
//                   <tr className="bg-gray-50">
//                     <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Role</th>
//                     {Object.keys(APP_CONFIG.rbac.pages).map(page => (
//                       <th key={page} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
//                         {page.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Object.values(getRoles()).map((role: any) => (
//                     <tr key={role.value} className="hover:bg-gray-50">
//                       <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">
//                         {role.label}
//                       </td>
//                       {Object.keys(APP_CONFIG.rbac.pages).map(page => {
//                         const pageConfig = APP_CONFIG.rbac.pages[page as keyof typeof APP_CONFIG.rbac.pages];
//                         const hasAccess = pageConfig.roles.includes(role.value as any);
//                         return (
//                           <td key={page} className="border border-gray-200 px-4 py-2 text-center">
//                             {getPermissionIcon(hasAccess)}
//                           </td>
//                         );
//                       })}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
// 
//           {/* API Access Matrix */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3 text-gray-900">API Access Matrix</h3>
//             <div className="space-y-2">
//               {Object.entries(APP_CONFIG.rbac.api).map(([endpoint, methods]) => (
//                 <div key={endpoint} className="border border-gray-200 rounded-lg p-4">
//                   <h4 className="font-medium text-gray-900 mb-2">{endpoint}</h4>
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//                     {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => {
//                       const hasAccess = (methods as any)[method as keyof typeof methods]?.length > 0;
//                       return (
//                         <div key={method} className="flex items-center justify-between p-2 bg-gray-50 rounded">
//                           <span className="text-sm font-medium text-gray-700">{method}</span>
//                           {getPermissionBadge(hasAccess)}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
// 
//           {/* Role Hierarchy */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3 text-gray-900">Role Hierarchy</h3>
//             <div className="space-y-2">
//               {Object.values(getRoles()).map((role: any) => (
//                 <div key={role.value} className="border border-gray-200 rounded-lg p-3">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <Badge className="bg-blue-100 text-blue-800 border-blue-200">
//                         Level {role.level}
//                       </Badge>
//                       <span className="font-medium text-gray-900">{role.label}</span>
//                       <span className="text-sm text-gray-500">({role.value})</span>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => toggleRole(role.value)}
//                     >
//                       {expandedRoles.includes(role.value) ? (
//                         <EyeOff className="w-4 h-4" />
//                       ) : (
//                         <Eye className="w-4 h-4" />
//                       )}
//                     </Button>
//                   </div>
//                   {expandedRoles.includes(role.value) && (
//                     <div className="mt-3 pt-3 border-t border-gray-200">
//                       <p className="text-sm text-gray-600 mb-2">{role.description}</p>
//                       <div className="flex flex-wrap gap-1">
//                         {role.permissions?.map((permission: string) => (
//                           <Badge key={permission} variant="outline" className="text-xs">
//                             {permission}
//                           </Badge>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

export default function SystemSettingsPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isISDepartment, setIsISDepartment] = useState(false);
  const [ticketConfig, setTicketConfig] = useState<TicketNumberingConfig>({
    emailPrefix: 'TIPA-HD',
    manualPrefix: 'TKT',
    emailSequencePadding: 3,
    manualSequencePadding: 6
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      const userRole = session.user.role?.toUpperCase();
      const userDepartment = session.user.department?.toUpperCase();
      
      setIsAdmin(userRole === 'ADMIN' || userRole === 'SENIOR MANAGER' || userRole === 'SENIOR_MANAGER');
      setIsISDepartment(userDepartment === 'IS');
    }
  }, [session]);

  useEffect(() => {
    if (isAdmin && isISDepartment) {
      fetchTicketConfig();
    }
  }, [isAdmin, isISDepartment]);

  const fetchTicketConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/helpdesk/ticket-numbering');
      if (response.ok) {
        const config = await response.json();
        setTicketConfig(config);
      } else {
        console.error('Failed to fetch ticket config');
      }
    } catch (error) {
      console.error('Error fetching ticket config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/helpdesk/ticket-numbering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketConfig),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving ticket config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* RBAC Matrix Moved to Admin Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            RBAC Matrix
          </CardTitle>
          <CardDescription>
            Role-based access control matrix has been moved to the Admin Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              The comprehensive RBAC matrix is now available in the Admin Dashboard under the Role Management tab.
            </p>
            <Link 
                              href="/lvm/admin?tab=roles" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Admin Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Numbering Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-600" />
            Ticket Numbering Configuration
          </CardTitle>
          <CardDescription>
            Configure ticket number prefixes and formats for helpdesk tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading configuration...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Message Display */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Email-based Ticket Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Email-based Tickets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailPrefix">Email Ticket Prefix</Label>
                    <Input
                      id="emailPrefix"
                      placeholder="TIPA-HD"
                      value={ticketConfig.emailPrefix}
                      onChange={(e) => setTicketConfig(prev => ({ ...prev, emailPrefix: e.target.value }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prefix for tickets created from emails (e.g., TIPA-HD-241215-001)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="emailSequencePadding">Sequence Padding</Label>
                    <Input
                      id="emailSequencePadding"
                      type="number"
                      min="1"
                      max="5"
                      placeholder="3"
                      value={ticketConfig.emailSequencePadding}
                      onChange={(e) => setTicketConfig(prev => ({ ...prev, emailSequencePadding: parseInt(e.target.value) || 3 }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of digits for sequence (e.g., 001, 002)
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Ticket Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Manual Tickets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manualPrefix">Manual Ticket Prefix</Label>
                    <Input
                      id="manualPrefix"
                      placeholder="TKT"
                      value={ticketConfig.manualPrefix}
                      onChange={(e) => setTicketConfig(prev => ({ ...prev, manualPrefix: e.target.value }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prefix for manually created tickets (e.g., TKT-000001)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="manualSequencePadding">Sequence Padding</Label>
                    <Input
                      id="manualSequencePadding"
                      type="number"
                      min="1"
                      max="8"
                      placeholder="6"
                      value={ticketConfig.manualSequencePadding}
                      onChange={(e) => setTicketConfig(prev => ({ ...prev, manualSequencePadding: parseInt(e.target.value) || 6 }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of digits for sequence (e.g., 000001, 000002)
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Configuration Display */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Current Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Email Tickets</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Prefix:</span> {ticketConfig.emailPrefix}</p>
                      <p><span className="font-medium">Format:</span> {ticketConfig.emailPrefix}-{new Date().toISOString().slice(2,8).replace(/-/g, '')}-001</p>
                      <p><span className="font-medium">Example:</span> {ticketConfig.emailPrefix}-241215-001</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Manual Tickets</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Prefix:</span> {ticketConfig.manualPrefix}</p>
                      <p><span className="font-medium">Format:</span> {ticketConfig.manualPrefix}-000001</p>
                      <p><span className="font-medium">Example:</span> {ticketConfig.manualPrefix}-000001</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveConfig} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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