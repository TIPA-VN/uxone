import { useState, useEffect } from 'react';
import { Project } from '../types/project';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/projects?id=${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch project');
        
        const data = await res.json();
        const proj = Array.isArray(data)
          ? data.find((p: { id: string | number }) => String(p.id) === String(projectId))
          : data;
        
        setProject(proj);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const updateProject = (updates: Partial<Project>) => {
    setProject(prev => prev ? { ...prev, ...updates } : null);
  };

  return {
    project,
    loading,
    error,
    updateProject,
  };
} 