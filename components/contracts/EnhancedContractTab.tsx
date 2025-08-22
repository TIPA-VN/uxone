"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { useContract } from '@/hooks/useContract';
import ContractTab from './ContractTab';
import ContractDocumentEditor from './ContractDocumentEditor';
import ContractWorkflowActions from './ContractWorkflowActions';
import FinalizedDocumentCard from './FinalizedDocumentCard';
import WorkflowProgressBar from './WorkflowProgressBar';
import DocumentVersionTimeline from './DocumentVersionTimeline';
import { 
  FileText, 
  Edit3, 
  Workflow,
  Download,
  Share2,
  CheckCircle,
  History
} from 'lucide-react';

interface EnhancedContractTabProps {
  project: Project;
  onUpdateContract?: (updates: Partial<Project['contractDetails']>) => void;
}

type TabType = 'details' | 'document' | 'workflow' | 'finalized' | 'versions';

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
      // Map status to action for the backend
      let action = newStatus;
      switch (newStatus) {
        case 'APPROVED':
          action = 'APPROVE';
          break;
        case 'REJECTED':
          action = 'REJECT';
          break;
        case 'SIGNED':
          action = 'SIGN';
          break;
        case 'EXECUTING':
          action = 'EXECUTE';
          break;
        case 'COMPLETED':
          action = 'COMPLETE';
          break;
        case 'DRAFT':
          action = 'REOPEN';
          break;
        case 'REVIEW':
          action = 'SEND_REVIEW';
          break;
        default:
          action = newStatus;
      }
      
      console.log('🚀 FRONTEND: Sending workflow action:', { action, newStatus, comment, contractId: project.contractDetails.id });
      
      const res = await fetch(`/api/contracts/${project.contractDetails.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comment
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('Workflow API response:', result);
        
        // Handle both success field and direct contract response
        if ((result.success || result.contract) && onUpdateContract) {
          const updatedContractData = result.contract || {};
          
          // Extract the key fields we need to update
          const contractStatus = updatedContractData.contractStatus || result.contractStatus;
          const currentApprovalLevel = updatedContractData.currentApprovalLevel || result.currentApprovalLevel;
          const totalApprovalLevels = updatedContractData.totalApprovalLevels || result.totalApprovalLevels;
          
          console.log('🔄 Updating contract state:', {
            contractStatus,
            currentApprovalLevel,
            totalApprovalLevels
          });
          
          // Update the parent component's state
          onUpdateContract({ 
            contractStatus,
            currentApprovalLevel,
            totalApprovalLevels,
            ...updatedContractData // Pass all other updated contract data
          });
        }
        
        return true; // Return true if API call succeeded (200 status)
      } else {
        const errorResult = await res.json().catch(() => ({}));
        console.error('Workflow API error:', errorResult);
        return false;
      }
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
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
    },
    {
      id: 'finalized' as TabType,
      label: 'Finalized Document',
      icon: CheckCircle,
      description: 'View approved and finalized contract'
    },
    {
      id: 'versions' as TabType,
      label: 'Version History',
      icon: History,
      description: 'Track document changes and versions'
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
          />
        )}
        
        {activeTab === 'finalized' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Finalized Document</h3>
              <p className="text-sm text-gray-500">
                View the approved and finalized version of this contract
              </p>
            </div>
            
            {/* Finalized Document Card will be added here when API is ready */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Finalized Document</h3>
              <p className="text-sm text-gray-500 mb-4">
                This contract will show the finalized document once it's approved
              </p>
              <p className="text-xs text-gray-400">
                Status: {project.contractDetails?.contractStatus || 'DRAFT'}
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'versions' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Version History</h3>
              <p className="text-sm text-gray-500">
                Track all changes and versions of this contract document
              </p>
            </div>
            
            {/* Document Version Timeline will be added here when API is ready */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Version History</h3>
              <p className="text-sm text-gray-500 mb-4">
                Document versions and change history will appear here
              </p>
              <p className="text-xs text-gray-400">
                Track changes, compare versions, and restore previous content
              </p>
            </div>
          </div>
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
