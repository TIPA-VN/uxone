import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHelpdesk } from '@/hooks/useHelpdesk';
import { getHelpdeskPermissionMatrix } from '@/config/app';

export const HelpdeskPermissionMatrix: React.FC = () => {
  const { userRole, permissionLevel, userPermissions } = useHelpdesk();
  const matrix = getHelpdeskPermissionMatrix();

  if (!userRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Helpdesk Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Please log in to view permissions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-lg font-semibold">{userRole}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Permission Level</p>
              <Badge variant="outline" className="text-sm">
                {permissionLevel}
              </Badge>
            </div>
          </div>
          
          {userPermissions && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Your Permissions:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(userPermissions).map(([permission, hasPermission]) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm capitalize">{permission.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Role Level</th>
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
                </tr>
              </thead>
              <tbody>
                {Object.entries(matrix).map(([level, config]) => (
                  <tr key={level} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">
                      <div>
                        <div className="capitalize">{level.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {config.roles.join(', ')}
                        </div>
                      </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 