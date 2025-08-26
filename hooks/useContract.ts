import { useState, useCallback } from 'react';

interface ContractDetails {
  id?: string;
  contractType?: string;
  counterparty?: string;
  value?: number;
  currency?: string;
  contractStatus?: string;
  contractNumber?: string;
  startDate?: Date;
  effectiveDate?: Date;
  expirationDate?: Date;
  endDate?: Date;
}

interface UseContractReturn {
  updateContract: (projectId: string, updates: Partial<ContractDetails>) => Promise<ContractDetails | null>;
  loading: boolean;
  error: string | null;
}

export function useContract(): UseContractReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateContract = useCallback(async (
    projectId: string, 
    updates: Partial<ContractDetails>
  ): Promise<ContractDetails | null> => {
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

      const updatedContract = await response.json();
      return updatedContract;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contract';
      setError(errorMessage);
      return null;
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
