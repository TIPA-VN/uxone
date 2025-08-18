'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ContractList } from '@/components/contracts/ContractList';
import { EnhancedContractEditor } from '@/components/contracts/EnhancedContractEditor';
import { useRouter } from 'next/navigation';

type ViewMode = 'list' | 'editor' | 'viewer';

interface Contract {
  id: string;
  title: string;
  contractType: string;
  workflowState: string;
  owner: {
    name: string;
    username: string;
  };
  department: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleCreateContract = () => {
    setIsCreating(true);
    setViewMode('editor');
    setSelectedContract(null);
  };

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setViewMode('editor');
    setIsCreating(false);
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setViewMode('viewer');
    setIsCreating(false);
  };

  const handleSaveContract = async (data: { content: string; title: string; contractType: string }) => {
    try {
      if (isCreating) {
        // Create new contract
        const response = await fetch('/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            content: data.content,
            contractType: data.contractType,
            projectId: 'default-project', // You might want to make this configurable
          }),
        });

        if (response.ok) {
          const newContract = await response.json();
          console.log('Contract created:', newContract);
          setViewMode('list');
          setIsCreating(false);
        } else {
          console.error('Failed to create contract');
        }
      } else if (selectedContract) {
        // Update existing contract
        const response = await fetch(`/api/contracts/${selectedContract.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            content: data.content,
            contractType: data.contractType,
          }),
        });

        if (response.ok) {
          const updatedContract = await response.json();
          console.log('Contract updated:', updatedContract);
          setViewMode('list');
          setSelectedContract(null);
        } else {
          console.error('Failed to update contract');
        }
      }
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleCancelEdit = () => {
    setViewMode('list');
    setSelectedContract(null);
    setIsCreating(false);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Contracts</h1>
                <p className="text-muted-foreground mt-2">
                  Manage and collaborate on contracts in real-time
                </p>
              </div>
              <Button onClick={handleCreateContract} size="lg">
                Create New Contract
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Contract Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ContractList
                  onEditContract={handleEditContract}
                  onViewContract={handleViewContract}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'editor':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {isCreating ? 'Create New Contract' : 'Edit Contract'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isCreating 
                    ? 'Create a new contract with real-time collaboration'
                    : `Editing: ${selectedContract?.title}`
                  }
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
              >
                Back to List
              </Button>
            </div>

            <Card className="min-h-[800px]">
              <CardContent className="p-0">
                <EnhancedContractEditor
                  contractId={selectedContract?.id || `new-${Date.now()}`}
                  initialContent={selectedContract ? '' : ''} // You might want to fetch the actual content
                  initialTitle={selectedContract?.title || ''}
                  initialContractType={selectedContract?.contractType || 'PURCHASE_CONTRACT'}
                  onSave={handleSaveContract}
                  onCancel={handleCancelEdit}
                  isReadOnly={false}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'viewer':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">View Contract</h1>
                <p className="text-muted-foreground mt-2">
                  Viewing: {selectedContract?.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEditContract(selectedContract!)}
                >
                  Edit Contract
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Back to List
                </Button>
              </div>
            </div>

            <Card className="min-h-[800px]">
              <CardContent className="p-0">
                <EnhancedContractEditor
                  contractId={selectedContract?.id || ''}
                  initialContent={''} // You might want to fetch the actual content
                  initialTitle={selectedContract?.title || ''}
                  initialContractType={selectedContract?.contractType || 'PURCHASE_CONTRACT'}
                  onSave={handleSaveContract}
                  onCancel={handleCancelEdit}
                  isReadOnly={true}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {renderContent()}
    </div>
  );
}
