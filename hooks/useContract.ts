import { useState, useCallback } from 'react';

interface ContractDetails {
  id?: string;
  contractType?: string;
  counterparty?: string;
  value?: number;
  currency?: string;
  contractStatus?: string;
  contractNumber?: string;
}

interface UseContractReturn {
  updateContract: (projectId: string, updates: Partial<ContractDetails>) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useContract(): UseContractReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateContract = useCallback(async (
    projectId: string, 
    updates: Partial<ContractDetails>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/contract`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update contract: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contract';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateContract,
    loading,
    error,
  };
}
