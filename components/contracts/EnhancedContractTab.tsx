"use client";

import React, { useState } from 'react';
import { Project } from '@/types';
import { useContract } from '@/hooks/useContract';
import ContractTab from './ContractTab';
import ContractDocumentEditor from './ContractDocumentEditor';
import ContractWorkflowActions from './ContractWorkflowActions';
import { 
  FileText, 
  Edit3, 
  Workflow,
  Download,
  Share2
} from 'lucide-react';

interface EnhancedContractTabProps {
  project: Project;
  onUpdateContract?: (updates: Partial<Project['contractDetails']>) => void;
}

type TabType = 'details' | 'document' | 'workflow';

export default function EnhancedContractTab({ project, onUpdateContract }: EnhancedContractTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const { updateContract } = useContract();

  const handleContractUpdate = async (updates: Partial<Project['contractDetails']>) => {
    const updatedContract = await updateContract(project.id, updates as Parameters<typeof updateContract>[1]);
    if (updatedContract && onUpdateContract) {
      onUpdateContract(updatedContract);
    }
    return !!updatedContract;
  };



  const handleStatusChange = async (newStatus: string, comment?: string): Promise<boolean> => {
    if (!project.contractDetails?.id) return false;
    
    try {
      const res = await fetch(`/api/contracts/${project.contractDetails.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newStatus,
          comment
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.success && onUpdateContract) {
          onUpdateContract({ contractStatus: result.contract.contractStatus });
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleRequestApproval = async (): Promise<boolean> => {
    if (!project.contractDetails?.id) return false;
    
    try {
      const res = await fetch(`/api/contracts/${project.contractDetails.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_APPROVAL'
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.success && onUpdateContract) {
          onUpdateContract({ contractStatus: result.contract.contractStatus });
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    // For now, just copy the project URL to clipboard
    const projectUrl = `${window.location.origin}/lvm/projects/${project.id}?tab=CONTRACT`;
    navigator.clipboard.writeText(projectUrl);
  };

  const tabs = [
    {
      id: 'details' as TabType,
      label: 'Contract Details',
      icon: FileText,
      description: 'View and edit contract information'
    },
    {
      id: 'document' as TabType,
      label: 'Document Editor',
      icon: Edit3,
      description: 'Edit contract content and manage versions'
    },
    {
      id: 'workflow' as TabType,
      label: 'Workflow',
      icon: Workflow,
      description: 'Manage approval and execution workflow'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contract Management</h2>
          <p className="text-sm text-gray-600">
            Comprehensive contract management for {project.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleShare}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'details' && (
          <ContractTab 
            project={project}
            onUpdateContract={handleContractUpdate}
          />
        )}
        
        {activeTab === 'document' && (
          <ContractDocumentEditor
            project={project}
            onShare={handleShare}
          />
        )}
        
        {activeTab === 'workflow' && (
          <ContractWorkflowActions
            project={project}
            onStatusChange={handleStatusChange}
            onRequestApproval={handleRequestApproval}
          />
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Current Status:</span> {project.contractDetails?.contractStatus || 'DRAFT'}
          </div>
          <div className="flex space-x-3">
            {activeTab !== 'document' && (
              <button
                onClick={() => setActiveTab('document')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Document
              </button>
            )}
            {activeTab !== 'workflow' && (
              <button
                onClick={() => setActiveTab('workflow')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Workflow className="w-4 h-4 mr-2" />
                Manage Workflow
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
