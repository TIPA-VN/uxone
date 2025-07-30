"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronDown, Building2, Users, ShoppingCart, Wrench, FileText, Shield } from 'lucide-react';

const DEPARTMENTS = [
  {
    code: 'OPS',
    name: 'Operations',
    icon: <Building2 size={16} />,
    color: 'text-blue-600'
  },
  {
    code: 'PROC',
    name: 'Procurement',
    icon: <ShoppingCart size={16} />,
    color: 'text-green-600'
  },
  {
    code: 'IT',
    name: 'Information Technology',
    icon: <Wrench size={16} />,
    color: 'text-purple-600'
  },
  {
    code: 'HR',
    name: 'Human Resources',
    icon: <Users size={16} />,
    color: 'text-orange-600'
  },
  {
    code: 'FIN',
    name: 'Finance',
    icon: <FileText size={16} />,
    color: 'text-red-600'
  },
  {
    code: 'ADMIN',
    name: 'Administration',
    icon: <Shield size={16} />,
    color: 'text-gray-600'
  }
];

export default function DepartmentSwitcher() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only show for admin users or in development
  if (!session?.user || (session.user.role !== 'ADMIN' && process.env.NODE_ENV === 'production')) {
    return null;
  }

  const currentDepartment = DEPARTMENTS.find(dept => dept.code === session.user.department) || DEPARTMENTS[0];

  const handleDepartmentChange = async (departmentCode: string) => {
    setIsLoading(true);
    try {
      // Update the session with the new department
      await update({
        ...session,
        user: {
          ...session.user,
          department: departmentCode,
          departmentName: DEPARTMENTS.find(dept => dept.code === departmentCode)?.name || 'Unknown Department'
        }
      });
      
      // Reload the page to reflect the new department
      window.location.reload();
    } catch (error) {
      console.error('Error switching department:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
      >
        <span className={currentDepartment.color}>{currentDepartment.icon}</span>
        <span className="font-medium text-gray-700">{currentDepartment.name}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Switch Department (Testing)</div>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.code}
                onClick={() => handleDepartmentChange(dept.code)}
                disabled={isLoading || dept.code === session.user.department}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  dept.code === session.user.department
                    ? 'bg-blue-50 text-blue-700 cursor-not-allowed'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className={dept.color}>{dept.icon}</span>
                <span className="font-medium">{dept.name}</span>
                {dept.code === session.user.department && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 