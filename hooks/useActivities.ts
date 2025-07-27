import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'login' | 'project' | 'task' | 'system';
  message: string;
  timestamp: string;
  icon: string;
  color: string;
  details?: string;
}

interface ActivitiesResponse {
  activities: Activity[];
  totalActivities: number;
}

interface UseActivitiesReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  totalActivities: number;
  refreshActivities: () => void;
}

export const useActivities = (limit: number = 10): UseActivitiesReturn => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActivities, setTotalActivities] = useState(0);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/activities?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data: ActivitiesResponse = await response.json();
      setActivities(data.activities);
      setTotalActivities(data.totalActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshActivities = () => {
    fetchActivities();
  };

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, [limit]);

  return {
    activities,
    loading,
    error,
    totalActivities,
    refreshActivities,
  };
}; 