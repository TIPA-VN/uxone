"use client";
import { useState, useEffect } from "react";
import { Plus, X, Save, AlertCircle, CheckCircle } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

interface DepartmentManagerProps {
  projectId: string;
  currentDepartments: string[];
  onDepartmentsUpdated: (departments: string[]) => void;
  user?: {
    id: string;
    role?: string;
    department?: string;
  } | null | undefined;
}

export function DepartmentManager({ 
  projectId, 
  currentDepartments, 
  onDepartmentsUpdated,
  user 
}: DepartmentManagerProps) {
  const [departments, setDepartments] = useState<string[]>(currentDepartments);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if user has permission to manage departments
  const canManageDepartments = () => {
    if (!user?.role) return false;
    
    const isProjectOwner = user.id === projectId; // This should be compared with project owner ID
    const isManager = [
      'ADMIN', 'GENERAL_DIRECTOR', 'GENERAL MANAGER', 'GENERAL_MANAGER',
      'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT GENERAL MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'ASSISTANT GENERAL MANAGER 2',
      'SENIOR_MANAGER', 'SENIOR MANAGER', 'SENIOR_MANAGER_2', 'SENIOR MANAGER 2', 'ASSISTANT_SENIOR_MANAGER', 'ASSISTANT SENIOR MANAGER',
      'MANAGER', 'MANAGER_2', 'MANAGER 2', 'ASSISTANT_MANAGER', 'ASSISTANT MANAGER', 'ASSISTANT_MANAGER_2', 'ASSISTANT MANAGER 2'
    ].includes(user.role.toUpperCase());
    
    return isProjectOwner || isManager;
  };

  // Get available departments from config
  useEffect(() => {
    const allDepartments = APP_CONFIG.departments
      .filter(dept => dept.isActive) // Only active departments
      .map(dept => dept.code) // Use 'code' field, not 'uxoneCode'
      .filter(Boolean);
    const available = allDepartments.filter(dept => dept && !departments.includes(dept));
    // Remove duplicates and ensure unique keys
    const uniqueAvailable = [...new Set(available)];
    
    console.log('DepartmentManager Debug:', {
      allDepartments,
      currentDepartments: departments,
      available,
      uniqueAvailable
    });
    
    setAvailableDepartments(uniqueAvailable);
  }, [departments]);

  const handleAddDepartment = () => {
    if (selectedDepartment && !departments.includes(selectedDepartment)) {
      setDepartments(prev => [...prev, selectedDepartment]);
      setSelectedDepartment("");
    }
  };

  // Departments cannot be removed once added
  // const handleRemoveDepartment = (departmentToRemove: string) => {
  //   setDepartments(prev => prev.filter(dept => dept !== departmentToRemove));
  // };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/departments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departments: departments,
          action: 'replace'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Departments updated successfully!' });
        onDepartmentsUpdated(departments);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update departments' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update departments' });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(departments.sort()) !== JSON.stringify(currentDepartments.sort());

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Project Departments</h3>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Current Departments */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Departments ({departments.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {departments.filter(Boolean).map((dept, index) => (
            <div
              key={`current-dept-${dept}-${index}`}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              <span>{dept}</span>
              {/* Remove button removed - departments cannot be removed once added */}
            </div>
          ))}
          {departments.length === 0 && (
            <span className="text-gray-500 text-sm italic">No departments assigned</span>
          )}
        </div>
        {departments.length > 0 && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <strong>Note:</strong> Departments cannot be removed once added to the project.
          </p>
        )}
      </div>

      {/* Add Department - Only show if user has permission */}
      {canManageDepartments() && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Department
          </label>
          <div className="flex gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option key="placeholder" value="">Select a department...</option>
              {availableDepartments.map((dept, index) => (
                <option key={`dept-${dept}-${index}`} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddDepartment}
              disabled={!selectedDepartment}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {availableDepartments.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              All available departments have been added to this project.
            </p>
          )}
        </div>
      )}

      {/* Permission denied message */}
      {!canManageDepartments() && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-sm text-gray-600">
            <strong>Access Restricted:</strong> Only project owners and managers can add departments to this project.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Adding departments will affect who can access this project. 
          Users from the assigned departments will be able to view and contribute to this project.
          <br />
          <strong>Important:</strong> Departments cannot be removed once added to the project.
        </p>
      </div>
    </div>
  );
}
