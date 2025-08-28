import { useState, useEffect } from 'react';
import { Project } from '@/types';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      
      const project = await res.json();
      setProject(project);
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const updateProject = (updates: Partial<Project>) => {
    setProject(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const refetchProject = async () => {
    return await fetchProject();
  };

  return {
    project,
    loading,
    error,
    updateProject,
    refetchProject,
  };
} 