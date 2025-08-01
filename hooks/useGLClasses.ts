import { useQuery } from '@tanstack/react-query';

const fetchGLClasses = async (): Promise<string[]> => {
  const response = await fetch('/api/jde/inventory/gl-classes');
  
  if (!response.ok) {
    throw new Error('Failed to fetch GL classes');
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch GL classes');
  }
  
  return data.data.glClasses;
};

export const useGLClasses = () => {
  return useQuery({
    queryKey: ['glClasses'],
    queryFn: fetchGLClasses,
    staleTime: 30 * 60 * 1000, // 30 minutes - GL classes don't change often
    gcTime: 60 * 60 * 1000,    // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}; 