"use client";

import React from 'react';
import ContractTab from '@/components/contracts/ContractTab';
import { Project } from '@/types';

export default function ContractDemoPage() {
  // Mock project data for demonstration
  const mockProject: Project = {
    id: 'demo-contract-1',
    name: 'Sample Contract Project',
    description: 'This is a demonstration contract project',
    status: 'ACTIVE',
    departments: ['IT', 'Finance'],
    documentTemplate: 'contract-template-1',
    documentNumber: 'CON-2025-001',
    projectType: 'CONTRACT',
    contractDetails: {
      id: 'contract-1',
      contractType: 'SERVICE_AGREEMENT',
      counterparty: 'Tech Solutions Inc.',
      value: 50000,
      currency: 'USD',
      contractStatus: 'REVIEW',
      contractNumber: 'CON-2025-001'
    },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z'
  };

  const handleContractUpdate = (updates: Partial<{
    contractType: string;
    counterparty: string;
    value: number | null;
    currency: string;
    contractStatus: string;
  }>) => {
    console.log('Contract updates:', updates);
    // In a real app, this would trigger a refresh of the project data
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contract Tab Demo</h1>
          <p className="mt-2 text-sm text-gray-600">
            This page demonstrates the ContractTab component functionality
          </p>
        </div>
        
        <ContractTab 
          project={mockProject} 
          onUpdateContract={handleContractUpdate}
        />
      </div>
    </div>
  );
}
