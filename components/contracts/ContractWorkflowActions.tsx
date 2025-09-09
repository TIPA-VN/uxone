"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { 
  CheckCircle, 
  XCircle, 
  PenTool, 
  Send, 
  Clock,
  AlertTriangle,
  UserCheck,
  FileText,
  Unlock,
  Info,
  Shield,
  Play,
  Pause,
  MessageSquare,
  Scale
} from 'lucide-react';
import DocumentCommentSystem from './DocumentCommentSystem';
import LegalReviewPanel from './LegalReviewPanel';

interface ContractWorkflowActionsProps {
  project: Project;
  onStatusChange?: (newStatus: string, comment?: string) => Promise<boolean>;
  user?: {
    id: string;
    name?: string;
    username?: string;
    department?: string;
    role?: string;
  };
}

interface ApprovalRequest {
  id: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Helper functions for approval management
const getApproverRole = (level: number): string => {
  const roleMap: { [key: number]: string } = {
    1: 'Purchasing Management / GM/AGM',
    2: 'Senior Manager', 
    3: 'General Manager',
    4: 'Executive Director'
  };
  return roleMap[level] || `Level ${level} Approver`;
};

const canUserApproveAtLevel = (userRole: string, level: number, userDepartment?: string, contractDepartment?: string): boolean => {
  const normalizedRole = userRole?.toUpperCase().trim();
  
  // Admin can approve at any level
  if (normalizedRole === 'ADMIN') {
    return true;
  }
  
  // LEGAL department specific approval hierarchy
  if (contractDepartment?.toUpperCase() === 'LEGAL') {
    const legalApprovalLevels: { [key: string]: number } = {
      'GENERAL_DIRECTOR': 3,
      'GENERAL DIRECTOR': 3,
      'VICE_GENERAL_DIRECTOR': 3,
      'VICE GENERAL DIRECTOR': 3,
      'CHIEF_SPECIALIST': 2,
      'CHIEF SPECIALIST': 2
    };
    
    // For LEGAL department, check if user is in LEGAL department and has appropriate role
    if (userDepartment?.toUpperCase() === 'LEGAL') {
      const userMaxLevel = legalApprovalLevels[normalizedRole] || 0;
      return userMaxLevel >= level;
    }
    
    // General Director and Vice General Director can approve LEGAL contracts at level 3
    if (normalizedRole === 'GENERAL_DIRECTOR' || normalizedRole === 'GENERAL DIRECTOR' ||
        normalizedRole === 'VICE_GENERAL_DIRECTOR' || normalizedRole === 'VICE GENERAL DIRECTOR') {
      return level <= 3;
    }
  }
  
  // Level 1 approval requires Purchasing Department Management or GM/AGM
  if (level === 1) {
    // Check if user is in Purchasing Department with management role
    const isPurchasingDept = userDepartment?.toUpperCase() === 'LVM-PUR' || 
                            userDepartment?.toUpperCase() === 'PROC' || 
                            userDepartment?.toUpperCase() === 'PR';
    
    const isManagementRole = [
      'GENERAL_MANAGER', 'GENERAL MANAGER',
      'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT GENERAL MANAGER',
      'ASSISTANT_GENERAL_MANAGER_2', 'ASSISTANT GENERAL MANAGER 2',
      'SENIOR_MANAGER', 'SENIOR MANAGER',
      'SENIOR_MANAGER_2', 'SENIOR MANAGER 2',
      'ASSISTANT_SENIOR_MANAGER', 'ASSISTANT SENIOR MANAGER',
      'MANAGER', 'MANAGER 2', 'MANAGER_2',
      'ASSISTANT_MANAGER', 'ASSISTANT MANAGER',
      'ASSISTANT_MANAGER_2', 'ASSISTANT MANAGER 2'
    ].includes(normalizedRole);
    
    // Level 1: Purchasing Department Management OR any GM/AGM
    return (isPurchasingDept && isManagementRole) || 
           (normalizedRole === 'GENERAL_MANAGER' || normalizedRole === 'GENERAL MANAGER' ||
            normalizedRole === 'ASSISTANT_GENERAL_MANAGER' || normalizedRole === 'ASSISTANT GENERAL MANAGER' ||
            normalizedRole === 'ASSISTANT_GENERAL_MANAGER_2' || normalizedRole === 'ASSISTANT GENERAL MANAGER 2');
  }
  
  // Default approval levels for other levels (2-4)
  const approvalLevels: { [key: string]: number } = {
    'GENERAL_DIRECTOR': 4,
    'GENERAL DIRECTOR': 4,
    'GENERAL_MANAGER': 3,
    'GENERAL MANAGER': 3,
    'ASSISTANT_GENERAL_MANAGER': 3,
    'ASSISTANT GENERAL MANAGER': 3,
    'ASSISTANT_GENERAL_MANAGER_2': 3,
    'ASSISTANT GENERAL MANAGER 2': 3,
    'SENIOR_MANAGER': 2,
    'SENIOR MANAGER': 2,
    'SENIOR_MANAGER_2': 2,
    'SENIOR MANAGER 2': 2,
    'ASSISTANT_SENIOR_MANAGER': 2,
    'ASSISTANT SENIOR MANAGER': 2,
    'MANAGER': 1,
    'MANAGER 2': 1,
    'MANAGER_2': 1,
    'ASSISTANT_MANAGER': 1,
    'ASSISTANT MANAGER': 1,
    'ASSISTANT_MANAGER_2': 1,
    'ASSISTANT MANAGER 2': 1
  };
  
  const userMaxLevel = approvalLevels[normalizedRole] || 0;
  return userMaxLevel >= level;
};

const getActionContext = (action: string, contract: any, userRole: string) => {
  const contexts: { [key: string]: any } = {
    'SEND_REVIEW': {
      title: 'Send for Review',
      description: 'Submit this contract for approval workflow',
      requirements: 'Contract must be in DRAFT status',
      nextStep: 'Contract will be sent to Level 1 approvers',
      icon: Send,
      color: 'blue'
    },
    'APPROVE': {
      title: `Approve Level ${contract.currentApprovalLevel}`,
      description: `Approve this contract at Level ${contract.currentApprovalLevel} of ${contract.totalApprovalLevels}`,
      requirements: 'You must be authorized to approve at this level',
      nextStep: contract.currentApprovalLevel === contract.totalApprovalLevels 
        ? 'Contract will be fully approved and ready for signing'
        : `Contract will advance to Level ${contract.currentApprovalLevel + 1}`,
      icon: CheckCircle,
      color: 'green'
    },
    'REJECT': {
      title: 'Reject Contract',
      description: 'Reject this contract and terminate the approval process',
      requirements: 'You must be authorized to reject at this level',
      nextStep: 'Contract will be terminated and cannot be resubmitted',
      icon: XCircle,
      color: 'red'
    },
    'SIGN': {
      title: 'Sign Contract',
      description: 'Sign the approved contract to make it legally binding',
      requirements: 'Contract must be fully approved',
      nextStep: 'Contract will be signed and ready for execution',
      icon: PenTool,
      color: 'indigo'
    },
    'EXECUTE': {
      title: 'Start Execution',
      description: 'Begin executing the signed contract',
      requirements: 'Contract must be signed',
      nextStep: 'Contract execution will begin',
      icon: Play,
      color: 'purple'
    },
    'COMPLETE': {
      title: 'Mark Complete',
      description: 'Mark the contract as completed',
      requirements: 'Contract must be in execution',
      nextStep: 'Contract will be marked as completed',
      icon: CheckCircle,
      color: 'green'
    },
    'HOLD': {
      title: 'Put on Hold',
      description: 'Temporarily pause contract execution',
      requirements: 'Contract must be in execution',
      nextStep: 'Contract execution will be paused',
      icon: Pause,
      color: 'yellow'
    },
    'UNHOLD': {
      title: 'Resume',
      description: 'Resume contract execution from hold',
      requirements: 'Contract must be on hold',
      nextStep: 'Contract execution will resume',
      icon: Play,
      color: 'green'
    },
    'REOPEN': {
      title: 'Reopen for Editing',
      description: 'Reopen the contract for editing',
      requirements: 'Contract must be approved but not signed',
      nextStep: 'Contract will return to draft status',
      icon: Unlock,
      color: 'yellow'
    }
  };
  
  return contexts[action] || {};
};

// Approval Progress Component
const ApprovalProgress = ({ contract, currentUserRole, userDepartment, contractDepartment }: { 
  contract: any, 
  currentUserRole: string,
  userDepartment?: string,
  contractDepartment?: string
}) => {
  const levels = Array.from({ length: contract.totalApprovalLevels }, (_, i) => i + 1);
  
  return (
    <div className="approval-progress bg-white shadow rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">Approval Progress</h4>
        <p className="text-xs text-gray-500 mt-1">Each level must be approved before advancing</p>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {levels.map((level) => {
            const isCompleted = level < contract.currentApprovalLevel;
            const isCurrent = level === contract.currentApprovalLevel;
            const isPending = level > contract.currentApprovalLevel;
            const canApprove = canUserApproveAtLevel(currentUserRole, level, userDepartment, contractDepartment);
            
            return (
              <div key={level} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                isCompleted ? 'bg-green-50 border-green-200' :
                isCurrent ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : level}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Level {level} - {getApproverRole(level)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isCompleted ? '✓ Approved' : 
                     isCurrent ? (canApprove ? '⏳ Pending your approval' : '⏳ Waiting for approval') : 
                     '⏸️ Waiting for previous levels'}
                  </div>
                </div>
                {isCurrent && canApprove && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    Action Required
                  </div>
                )}
                {isCurrent && !canApprove && (
                  <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Not Authorized
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{contract.currentApprovalLevel - 1} of {contract.totalApprovalLevels} levels completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((contract.currentApprovalLevel - 1) / contract.totalApprovalLevels) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ContractWorkflowActions({ 
  project, 
  onStatusChange,
  user 
}: ContractWorkflowActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [showLegalReview, setShowLegalReview] = useState(false);
  const [legalReviewStatus, setLegalReviewStatus] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('STAFF');

  // Fetch approval history from API
  const fetchApprovalHistory = async () => {
    if (!project.contractDetails?.id) return;
    
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/contracts/${project.contractDetails.id}/approve`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // Transform API data to component format
          const history = result.approvalHistory.map((item: any) => ({
            id: item.id,
            requestedBy: item.approver.name || item.approver.username,
            requestedAt: item.createdAt,
            status: item.status,
            comment: item.comments,
            approvedBy: item.approver.name || item.approver.username,
            approvedAt: item.approvedAt
          }));
          setApprovalHistory(history);
        }
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load approval history when component mounts or when showing history
  useEffect(() => {
    if (showApprovalHistory && approvalHistory.length === 0) {
      fetchApprovalHistory();
    }
  }, [showApprovalHistory]);

  // Get current user role (you might need to pass this as a prop or get it from context)
  useEffect(() => {
    // This is a placeholder - you should get the actual user role from your auth context
    // For now, we'll use a default role, but in production you'd get this from session/auth
    setCurrentUserRole('MANAGER'); // This should be replaced with actual user role
  }, []);

  if (!project.contractDetails) {
    return null;
  }

  const contract = project.contractDetails;
  
  // Force component to re-render when contract details change
  const contractKey = `${contract.contractStatus}-${contract.currentApprovalLevel}-${contract.totalApprovalLevels}`;
  
  // Force re-render when contract status changes
  useEffect(() => {
              }, [contract.contractStatus, contract.currentApprovalLevel, contract.totalApprovalLevels]);
  const currentStatus = contract.contractStatus || 'DRAFT';
  
  // Debug logging for contract status
    const handleAction = async (action: string) => {
        setActionType(action);
    setComment('');
    setShowCommentModal(true);
      };

  const handleConfirmAction = async () => {
        if (!onStatusChange) {
            return;
    }
    
    setIsProcessing(true);
    setMessage('');
    
    try {
      let newStatus = currentStatus;
      
      switch (actionType) {
        case 'SEND_REVIEW':
          newStatus = 'REVIEW';
          break;
        case 'APPROVE':
          newStatus = 'APPROVED';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          break;
        case 'SIGN':
          newStatus = 'SIGNED';
          break;
        case 'EXECUTE':
          newStatus = 'EXECUTING';
          break;
        case 'COMPLETE':
          newStatus = 'COMPLETED';
          break;
        case 'HOLD':
          newStatus = 'ON_HOLD';
          break;
        case 'UNHOLD':
          newStatus = 'EXECUTING';
          break;
        case 'REOPEN':
          newStatus = 'DRAFT';
          break;
      }
      
            const success = await onStatusChange(newStatus, comment);
            if (success) {
        setMessage(`Contract ${actionType.toLowerCase()}d successfully!`);
        setShowCommentModal(false);
        
        // Component will re-render automatically with updated data
        
        // Refresh approval history if it's currently showing
        if (showApprovalHistory) {
          fetchApprovalHistory();
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Failed to ${actionType.toLowerCase()} contract. Please try again.`);
      }
    } catch (error) {
      setMessage(`Error ${actionType.toLowerCase()}ing contract. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    const currentLevel = contract.currentApprovalLevel || 1;
    const totalLevels = contract.totalApprovalLevels || 3;
    
    switch (currentStatus) {
      case 'DRAFT':
        actions.push({
          key: 'SEND_REVIEW',
          label: 'Send for Review',
          icon: Send,
          color: 'blue',
          action: () => handleAction('SEND_REVIEW'),
          context: getActionContext('SEND_REVIEW', contract, currentUserRole)
        });
        break;
        
      case 'REVIEW':
        // Check if user can approve at current level
        const userDepartment = project.owner?.department || '';
        const contractDepartment = project.departments?.[0] || '';
        
        if (canUserApproveAtLevel(currentUserRole, currentLevel, userDepartment, contractDepartment)) {
          actions.push({
            key: 'APPROVE',
            label: `Approve Level ${currentLevel}`,
            icon: CheckCircle,
            color: 'green',
            action: () => handleAction('APPROVE'),
            context: getActionContext('APPROVE', contract, currentUserRole)
          });
        }
        
        // Check if user can reject at current level
        if (canUserApproveAtLevel(currentUserRole, currentLevel, userDepartment, contractDepartment)) {
          actions.push({
            key: 'REJECT',
            label: 'Reject Contract',
            icon: XCircle,
            color: 'red',
            action: () => handleAction('REJECT'),
            context: getActionContext('REJECT', contract, currentUserRole)
          });
        }
        break;
        
      case 'APPROVED':
        actions.push(
          {
            key: 'SIGN',
            label: 'Sign Contract',
            icon: PenTool,
            color: 'indigo',
            action: () => handleAction('SIGN'),
            context: getActionContext('SIGN', contract, currentUserRole)
          },
          {
            key: 'REOPEN',
            label: 'Reopen for Editing',
            icon: Unlock,
            color: 'yellow',
            action: () => handleAction('REOPEN'),
            context: getActionContext('REOPEN', contract, currentUserRole)
          }
        );
        break;
        
      case 'SIGNED':
        actions.push({
          key: 'EXECUTE',
          label: 'Start Execution',
          icon: Play,
          color: 'purple',
          action: () => handleAction('EXECUTE'),
          context: getActionContext('EXECUTE', contract, currentUserRole)
        });
        break;
        
      case 'EXECUTING':
        actions.push(
          {
            key: 'COMPLETE',
            label: 'Mark Complete',
            icon: CheckCircle,
            color: 'green',
            action: () => handleAction('COMPLETE'),
            context: getActionContext('COMPLETE', contract, currentUserRole)
          },
          {
            key: 'HOLD',
            label: 'Put on Hold',
            icon: Pause,
            color: 'yellow',
            action: () => handleAction('HOLD'),
            context: getActionContext('HOLD', contract, currentUserRole)
          }
        );
        break;
        
      case 'ON_HOLD':
        actions.push({
          key: 'UNHOLD',
          label: 'Resume',
          icon: Play,
          color: 'green',
          action: () => handleAction('UNHOLD'),
          context: getActionContext('UNHOLD', contract, currentUserRole)
        });
        break;
    }
    
    return actions;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SIGNED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXECUTING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4" />;
      case 'REVIEW': return <AlertTriangle className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'SIGNED': return <PenTool className="w-4 h-4" />;
      case 'EXECUTING': return <Clock className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'ON_HOLD': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableActions = getAvailableActions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contract Workflow</h2>
          <p className="text-sm text-gray-600">
            Manage contract approval and execution workflow
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowApprovalHistory(!showApprovalHistory)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileText className="w-4 h-4 mr-2" />
            Approval History
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.includes('successfully') 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {message.includes('successfully') ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.includes('successfully') ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Current Status</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}>
                {getStatusIcon(currentStatus)}
                <span className="ml-2">{currentStatus}</span>
              </span>
              
              {/* Show approval level for REVIEW status */}
              {currentStatus === 'REVIEW' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Level {contract.currentApprovalLevel || 1} of {contract.totalApprovalLevels || 3}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Progress - Show for REVIEW status */}
      {currentStatus === 'REVIEW' && (
        <ApprovalProgress 
          contract={contract} 
          currentUserRole={currentUserRole}
          userDepartment={project.owner?.department || ''}
          contractDepartment={project.departments?.[0] || ''}
        />
      )}

      {/* Available Actions */}
      {availableActions.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Available Actions</h3>
              {currentStatus === 'REVIEW' && (
                <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                  💡 Each approval advances to the next level
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {availableActions.map((action) => {
                const context = action.context;
                const canPerform = canUserApproveAtLevel(currentUserRole, contract.currentApprovalLevel || 1) || 
                                 action.key === 'SEND_REVIEW' || 
                                 action.key === 'SIGN' || 
                                 action.key === 'EXECUTE' || 
                                 action.key === 'COMPLETE' || 
                                 action.key === 'HOLD' || 
                                 action.key === 'UNHOLD' || 
                                 action.key === 'REOPEN';
                
                return (
                  <div key={action.key} className="action-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={action.action}
                        disabled={isProcessing || !canPerform}
                        className={`flex items-center justify-center px-4 py-3 border rounded-lg shadow-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          action.color === 'blue' ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200' :
                          action.color === 'green' ? 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200' :
                          action.color === 'red' ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200' :
                          action.color === 'purple' ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200' :
                          action.color === 'indigo' ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200' :
                          action.color === 'yellow' ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-200' :
                          'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <action.icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </button>
                      
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {context.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {context.description}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          <strong>Requirements:</strong> {context.requirements}
                        </div>
                        <div className="text-xs text-blue-600">
                          <strong>Next:</strong> {context.nextStep}
                        </div>
                        {!canPerform && (
                          <div className="text-xs text-red-500 mt-2 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            You don't have permission to perform this action
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Approval History */}
      {showApprovalHistory && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Approval History</h3>
            <p className="text-xs text-gray-500 mt-1">Complete timeline of contract approvals and decisions</p>
          </div>
          <div className="p-4">
            {isLoadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading approval history...</p>
              </div>
            ) : approvalHistory.length > 0 ? (
              <div className="space-y-4">
                {approvalHistory.map((request, index) => (
                  <div key={request.id} className="approval-item border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        request.status === 'APPROVED' ? 'bg-green-500 text-white' : 
                        request.status === 'REJECTED' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {request.status === 'APPROVED' ? '✓' : 
                         request.status === 'REJECTED' ? '✗' : '⏳'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              {request.requestedBy}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(request.requestedAt)}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        
                        {request.comment && (
                          <div className="bg-gray-50 rounded-md p-3 mb-2">
                            <p className="text-xs text-gray-600 font-medium mb-1">Comment:</p>
                            <p className="text-sm text-gray-700">
                              "{request.comment}"
                            </p>
                          </div>
                        )}
                        
                        {request.approvedBy && request.approvedAt && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Finalized by:</span> {request.approvedBy} on {formatDate(request.approvedAt)}
                          </div>
                        )}
                        
                        {/* Show approval level if available */}
                        <div className="text-xs text-blue-600 mt-1">
                          Approval #{index + 1} in sequence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium">No approval history found</p>
                <p className="text-xs mt-1">Approval history will appear here once the contract is sent for review</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType} Contract
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a comment about this action..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCommentModal(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment System and Legal Review */}
      {project.contractDetails && (
        <div className="mt-6 space-y-6">
          {/* Action Buttons for Comments and Legal Review */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showComments ? 'Hide' : 'Show'} Comments</span>
            </button>
            
            {(user?.department?.toUpperCase() === 'LEGAL' || 
              user?.role === 'ADMIN' || 
              ['GENERAL_DIRECTOR', 'GENERAL DIRECTOR', 'VICE_GENERAL_DIRECTOR', 'VICE GENERAL DIRECTOR'].includes(user?.role?.toUpperCase() || '')) && (
              <button
                onClick={() => setShowLegalReview(!showLegalReview)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Scale className="w-4 h-4" />
                <span>{showLegalReview ? 'Hide' : 'Show'} Legal Review</span>
              </button>
            )}
          </div>

          {/* Document Comment System */}
          {showComments && user && (
            <DocumentCommentSystem
              contractId={project.contractDetails.id}
              documentContent={project.contractDetails.document?.content || ''}
              user={user}
              isLegalReview={user?.department?.toUpperCase() === 'LEGAL'}
              onCommentAdded={(comment) => {
                console.log('Comment added:', comment);
              }}
              onCommentUpdated={(comment) => {
                console.log('Comment updated:', comment);
              }}
              onCommentDeleted={(commentId) => {
                console.log('Comment deleted:', commentId);
              }}
            />
          )}

          {/* Legal Review Panel */}
          {showLegalReview && user && (
            <LegalReviewPanel
              contractId={project.contractDetails.id}
              user={user}
              onReviewStatusChange={(status) => {
                setLegalReviewStatus(status);
                console.log('Legal review status changed:', status);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

