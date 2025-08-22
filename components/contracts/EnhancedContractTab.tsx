"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { useContract } from '@/hooks/useContract';
import ContractTab from './ContractTab';
import ContractDocumentEditor from './ContractDocumentEditor';
import ContractWorkflowActions from './ContractWorkflowActions';
import FinalizedDocumentTab from './FinalizedDocumentTab';
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
  const [workflowRefreshKey, setWorkflowRefreshKey] = useState(0);
  const { updateContract } = useContract();

  const handleContractUpdate = async (updates: Partial<Project['contractDetails']>) => {
    const updatedContract = await updateContract(project.id, updates as Parameters<typeof updateContract>[1]);
    if (updatedContract && onUpdateContract) {
      onUpdateContract(updatedContract);
    }
    return !!updatedContract;
  };

  // Wrapper function for ContractTab that matches its expected signature
  const handleContractTabUpdate = (updates: Partial<{
    contractType: string;
    counterparty: string;
    value: number | null;
    currency: string;
    contractStatus: string;
  }>) => {
    // Convert the updates to the format expected by handleContractUpdate
    const contractUpdates: Partial<Project['contractDetails']> = {
      ...updates,
      value: updates.value !== null ? updates.value : undefined
    };
    
    handleContractUpdate(contractUpdates);
  };



  const handleStatusChange = async (newStatus: string, comment?: string): Promise<boolean> => {
    console.log('🔍 FRONTEND: handleStatusChange called with:', { 
      newStatus, 
      comment, 
      contractId: project.contractDetails?.id,
      contractStatus: project.contractDetails?.contractStatus 
    });
    
    if (!project.contractDetails?.id) {
      console.error('❌ FRONTEND: No contract ID found!', project.contractDetails);
      return false;
    }
    
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
      
      const requestBody = {
        action,
        comment
      };
      const requestUrl = `/api/contracts/${project.contractDetails.id}/workflow`;
      
      console.log('🚀 FRONTEND: Request details:', {
        url: requestUrl,
        method: 'POST',
        body: requestBody
      });
      
      let res;
      try {
        res = await fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        console.log('🚀 FRONTEND: Response status:', res.status, res.statusText);
      } catch (fetchError: any) {
        console.error('🚨 FRONTEND: Fetch error:', fetchError);
        throw new Error(`Network request failed: ${fetchError?.message || 'Unknown error'}`);
      }
      
              if (res.ok) {
          const result = await res.json();
          console.log('Workflow API response:', result);
          console.log('🔍 Response analysis:', {
            success: result.success,
            hasContract: !!result.contract,
            contractStatus: result.contract?.contractStatus,
            resultStatus: result.contractStatus,
            message: result.message,
            targetStatus: newStatus,
            fullResponse: result
          });
        
        // Handle both success field and direct contract response
        if ((result.success || result.contract) && onUpdateContract) {
          const updatedContractData = result.contract || {};
          
          // Extract the key fields we need to update - prioritize the response fields
          let contractStatus = result.contractStatus || updatedContractData.contractStatus;
          const currentApprovalLevel = result.currentApprovalLevel || updatedContractData.currentApprovalLevel;
          const totalApprovalLevels = result.totalApprovalLevels || updatedContractData.totalApprovalLevels;
          
          console.log('🔍 Extracted fields:', {
            contractStatus,
            currentApprovalLevel,
            totalApprovalLevels,
            fromResult: {
              contractStatus: result.contractStatus,
              currentApprovalLevel: result.currentApprovalLevel,
              totalApprovalLevels: result.totalApprovalLevels
            },
            fromContract: {
              contractStatus: updatedContractData.contractStatus,
              currentApprovalLevel: updatedContractData.currentApprovalLevel,
              totalApprovalLevels: updatedContractData.totalApprovalLevels
            }
          });
          
          // Special handling for different workflow messages
          if (result.message === 'Already approved this level') {
            // When backend says "Already approved this level", we should fetch the latest status
            // to see if the contract is actually approved now
            try {
              const statusRes = await fetch(`/api/contracts/${project.contractDetails?.id}`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.contract) {
                  contractStatus = statusData.contract.contractStatus || contractStatus;
                  console.log('🔄 Fetched latest contract status:', contractStatus);
                }
              }
            } catch (fetchError) {
              console.warn('Could not fetch latest contract status:', fetchError);
            }
          } else if (result.message === 'Contract fully approved') {
            // When backend says "Contract fully approved", use the returned contract data
            console.log('🎉 Contract fully approved! Using returned contract data');
            contractStatus = updatedContractData.contractStatus || 'APPROVED';
          } else if (result.success && result.contract) {
            // For all other successful workflow actions, use the returned contract status
            console.log('✅ Workflow action successful, updating status');
            contractStatus = result.contract.contractStatus || contractStatus;
          } else if (!contractStatus && newStatus) {
            // Fallback: if no status in response, use the status we were trying to set
            console.log('⚠️ No status in response, using target status:', newStatus);
            contractStatus = newStatus;
          }
          
          // Only use fallback if we truly have no status from the backend
          if (!contractStatus) {
            console.log('🔄 No status from backend, using target status as fallback:', newStatus);
            contractStatus = newStatus;
          }
          
          console.log('🔄 Updating contract state:', {
            contractStatus,
            currentApprovalLevel,
            totalApprovalLevels,
            message: result.message
          });
          
          console.log('🔍 Preserving existing contract details:', {
            id: project.contractDetails?.id,
            existingFields: Object.keys(project.contractDetails || {})
          });
          
          // Update the parent component's state with the correct type
          // CRITICAL: Always preserve the existing contractDetails and merge updates
          const updates: Partial<Project['contractDetails']> = {
            ...project.contractDetails, // Preserve ALL existing fields including id
            contractStatus,
            currentApprovalLevel,
            totalApprovalLevels
          };
          
          console.log('🔍 Final updates object:', {
            id: updates.id,
            contractStatus: updates.contractStatus,
            currentApprovalLevel: updates.currentApprovalLevel
          });
          
          // Override with any new data from the backend response
          if (updatedContractData.contractType) updates.contractType = updatedContractData.contractType;
          if (updatedContractData.counterparty) updates.counterparty = updatedContractData.counterparty;
          if (updatedContractData.value !== undefined) updates.value = updatedContractData.value;
          if (updatedContractData.currency) updates.currency = updatedContractData.currency;
          if (updatedContractData.contractNumber) updates.contractNumber = updatedContractData.contractNumber;
          
          onUpdateContract(updates);
          
          // Force re-render of workflow component
          console.log('🔄 Force re-rendering workflow component with new key');
          setWorkflowRefreshKey(prev => {
            const newKey = prev + 1;
            console.log('🔄 New workflow refresh key:', newKey);
            return newKey;
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
            onUpdateContract={handleContractTabUpdate}
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
            key={`workflow-${project.contractDetails?.contractStatus}-${project.contractDetails?.currentApprovalLevel}-${project.contractDetails?.totalApprovalLevels}-${workflowRefreshKey}`}
            project={project}
            onStatusChange={handleStatusChange}
          />
        )}
        
        {activeTab === 'finalized' && (
          <FinalizedDocumentTab 
            project={project}
            onRefresh={() => setWorkflowRefreshKey(prev => prev + 1)}
          />
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
