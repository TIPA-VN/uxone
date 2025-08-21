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
  Lock,
  Unlock
} from 'lucide-react';

interface ContractWorkflowActionsProps {
  project: Project;
  onStatusChange?: (newStatus: string, comment?: string) => Promise<boolean>;
  onRequestApproval?: () => Promise<boolean>;
  onUnlockDocument?: () => Promise<boolean>;
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

export default function ContractWorkflowActions({ 
  project, 
  onStatusChange,
  onRequestApproval,
  onUnlockDocument
}: ContractWorkflowActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  if (!project.contractDetails) {
    return null;
  }

  const contract = project.contractDetails;
  const currentStatus = contract.contractStatus || 'DRAFT';

  const handleAction = async (action: string) => {
    setActionType(action);
    setComment('');
    setShowCommentModal(true);
  };

  const handleConfirmAction = async () => {
    if (!onStatusChange) return;
    
    setIsProcessing(true);
    setMessage('');
    
    try {
      let newStatus = currentStatus;
      
      switch (actionType) {
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
        case 'REOPEN':
          newStatus = 'DRAFT';
          break;
      }
      
      const success = await onStatusChange(newStatus, comment);
      if (success) {
        setMessage(`Contract ${actionType.toLowerCase()}d successfully!`);
        setShowCommentModal(false);
        
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

  const handleRequestApproval = async () => {
    if (!onRequestApproval) return;
    
    setIsProcessing(true);
    setMessage('');
    
    try {
      const success = await onRequestApproval();
      if (success) {
        setMessage('Approval request sent successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to send approval request. Please try again.');
      }
    } catch (error) {
      setMessage('Error sending approval request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    
    switch (currentStatus) {
      case 'DRAFT':
        actions.push(
          { key: 'SEND_REVIEW', label: 'Send for Review', icon: Send, color: 'blue', action: () => handleAction('SEND_REVIEW') }
        );
        break;
      case 'REVIEW':
        actions.push(
          { key: 'APPROVE', label: 'Approve', icon: CheckCircle, color: 'green', action: () => handleAction('APPROVE') },
          { key: 'REJECT', label: 'Reject', icon: XCircle, color: 'red', action: () => handleAction('REJECT') },
          { key: 'REQUEST_APPROVAL', label: 'Request Approval', icon: UserCheck, color: 'purple', action: handleRequestApproval }
        );
        break;
      case 'APPROVED':
        actions.push(
          { key: 'SIGN', label: 'Sign Contract', icon: PenTool, color: 'indigo', action: () => handleAction('SIGN') },
          { key: 'REOPEN', label: 'Reopen for Editing', icon: Unlock, color: 'yellow', action: () => handleAction('REOPEN') }
        );
        break;
      case 'SIGNED':
        actions.push(
          { key: 'EXECUTE', label: 'Start Execution', icon: Play, color: 'purple', action: () => handleAction('EXECUTE') }
        );
        break;
      case 'EXECUTING':
        actions.push(
          { key: 'COMPLETE', label: 'Mark Complete', icon: CheckCircle, color: 'green', action: () => handleAction('COMPLETE') }
        );
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
        <button
          onClick={() => setShowApprovalHistory(!showApprovalHistory)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FileText className="w-4 h-4 mr-2" />
          Approval History
        </button>
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
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>

      {/* Available Actions */}
      {availableActions.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Available Actions</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableActions.map((action) => (
                <button
                  key={action.key}
                  onClick={action.action}
                  disabled={isProcessing}
                  className={`flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval History */}
      {showApprovalHistory && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Approval History</h3>
          </div>
          <div className="p-4">
            {isLoadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading approval history...</p>
              </div>
            ) : approvalHistory.length > 0 ? (
              <div className="space-y-3">
                {approvalHistory.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {request.requestedBy}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(request.requestedAt)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      {request.comment && (
                        <p className="text-xs text-gray-600 mt-1">
                          {request.comment}
                        </p>
                      )}
                      {request.approvedBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Approved by {request.approvedBy} on {formatDate(request.approvedAt!)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No approval history found</p>
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
    </div>
  );
}

// Missing Play icon component
const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
