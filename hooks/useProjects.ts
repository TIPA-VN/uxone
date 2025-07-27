import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Project } from '@/types';

export const useProjects = () => {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: {
    name: string;
    description?: string;
    departments: string[];
    documentTemplate?: string;
  }) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create project');
      }
      
      await fetchProjects(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return false;
    }
  }, [fetchProjects]);

  const updateProjectStatus = useCallback(async (projectId: string, status: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectIds: [projectId],
          updates: { status }
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update project status');
      }
      
      await fetchProjects(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project status');
      return false;
    }
  }, [fetchProjects]);

  const getProjectById = useCallback((projectId: string) => {
    return projects.find(p => p.id === projectId);
  }, [projects]);

  const getMyProjects = useCallback(() => {
    return projects.filter(p => p.ownerId === session?.user?.id);
  }, [projects, session?.user?.id]);

  const getProjectsByDepartment = useCallback((department: string) => {
    return projects.filter(p => 
      p.departments?.some(dept => dept.toLowerCase() === department.toLowerCase())
    );
  }, [projects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProjectStatus,
    getProjectById,
    getMyProjects,
    getProjectsByDepartment,
  };
}; 