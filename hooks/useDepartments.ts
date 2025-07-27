import { useState, useEffect } from 'react';

interface Department {
  value: string;
  label: string;
  description: string;
  color: string;
  userCount: number;
}

interface DepartmentsResponse {
  departments: Department[];
  totalDepartments: number;
  totalUsers: number;
}

interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: string | null;
  totalDepartments: number;
  totalUsers: number;
  refreshDepartments: () => void;
}

export const useDepartments = (): UseDepartmentsReturn => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/departments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data: DepartmentsResponse = await response.json();
      setDepartments(data.departments);
      setTotalDepartments(data.totalDepartments);
      setTotalUsers(data.totalUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshDepartments = () => {
    fetchDepartments();
  };

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    error,
    totalDepartments,
    totalUsers,
    refreshDepartments,
  };
}; 