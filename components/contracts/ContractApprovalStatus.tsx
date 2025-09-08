"use client";

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  PenTool, 
  Play, 
  Pause,
  FileText,
  UserCheck
} from 'lucide-react';

interface ContractApprovalStatusProps {
  contract: {
    contractStatus: string;
    currentApprovalLevel: number;
    totalApprovalLevels: number;
    contractNumber?: string;
    counterparty?: string;
    value?: number;
    currency?: string;
  };
  userRole: string;
}

const getStatusInfo = (status: string) => {
  const statusMap: { [key: string]: any } = {
    'DRAFT': {
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Draft',
      description: 'Contract is being prepared'
    },
    'REVIEW': {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Under Review',
      description: 'Awaiting approval'
    },
    'APPROVED': {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Approved',
      description: 'Ready for signing'
    },
    'SIGNED': {
      icon: PenTool,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      label: 'Signed',
      description: 'Legally binding'
    },
    'EXECUTING': {
      icon: Play,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      label: 'Executing',
      description: 'In progress'
    },
    'COMPLETED': {
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Completed',
      description: 'Successfully finished'
    },
    'ON_HOLD': {
      icon: Pause,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'On Hold',
      description: 'Temporarily paused'
    },
    'TERMINATED': {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Terminated',
      description: 'Contract cancelled'
    }
  };
  
  return statusMap[status] || statusMap['DRAFT'];
};

const getApprovalProgress = (currentLevel: number, totalLevels: number) => {
  const completedLevels = Math.max(0, currentLevel - 1);
  const progressPercentage = (completedLevels / totalLevels) * 100;
  
  return {
    completed: completedLevels,
    total: totalLevels,
    percentage: progressPercentage,
    currentLevel: currentLevel
  };
};

const canUserApproveAtLevel = (userRole: string, level: number): boolean => {
  const approvalLevels: { [key: string]: number } = {
    'ADMIN': 4,
    'GENERAL_DIRECTOR': 4,
    'GENERAL_MANAGER': 3,
    'ASSISTANT_GENERAL_MANAGER': 3,
    'ASSISTANT_GENERAL_MANAGER_2': 3,
    'SENIOR_MANAGER': 2,
    'SENIOR_MANAGER_2': 2,
    'ASSISTANT_SENIOR_MANAGER': 2,
    'MANAGER': 1,
    'MANAGER_2': 1,
    'ASSISTANT_MANAGER': 1,
    'ASSISTANT_MANAGER_2': 1
  };
  
  const userMaxLevel = approvalLevels[userRole] || 0;
  return userMaxLevel >= level;
};

const getApproverRole = (level: number): string => {
  const roleMap: { [key: number]: string } = {
    1: 'Department Manager',
    2: 'Senior Manager', 
    3: 'General Manager',
    4: 'Executive Director'
  };
  return roleMap[level] || `Level ${level} Approver`;
};

export default function ContractApprovalStatus({ contract, userRole }: ContractApprovalStatusProps) {
  const statusInfo = getStatusInfo(contract.contractStatus);
  const progress = getApprovalProgress(contract.currentApprovalLevel, contract.totalApprovalLevels);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-4">
      {/* Contract Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Contract {contract.contractNumber || 'N/A'}
            </h3>
            {contract.counterparty && (
              <p className="text-sm text-gray-600">
                Counterparty: {contract.counterparty}
              </p>
            )}
            {contract.value && (
              <p className="text-sm text-gray-600">
                Value: {contract.currency || '$'}{contract.value.toLocaleString()}
              </p>
            )}
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}>
            <StatusIcon className="w-4 h-4 mr-2" />
            {statusInfo.label}
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          {statusInfo.description}
        </p>
      </div>

      {/* Approval Progress - Only show for REVIEW status */}
      {contract.contractStatus === 'REVIEW' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Approval Progress</h4>
            <span className="text-sm text-gray-600">
              {progress.completed} of {progress.total} levels completed
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          
          {/* Level Details */}
          <div className="space-y-2">
            {Array.from({ length: contract.totalApprovalLevels }, (_, i) => i + 1).map((level) => {
              const isCompleted = level < contract.currentApprovalLevel;
              const isCurrent = level === contract.currentApprovalLevel;
              const canApprove = canUserApproveAtLevel(userRole, level);
              
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
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Next Steps</h4>
            <div className="text-sm text-blue-800">
              {contract.contractStatus === 'DRAFT' && (
                <p>Send this contract for review to begin the approval process.</p>
              )}
              {contract.contractStatus === 'REVIEW' && (
                <p>
                  {canUserApproveAtLevel(userRole, contract.currentApprovalLevel) 
                    ? `You can approve or reject this contract at Level ${contract.currentApprovalLevel}.`
                    : `This contract is waiting for approval at Level ${contract.currentApprovalLevel} by ${getApproverRole(contract.currentApprovalLevel)}.`
                  }
                </p>
              )}
              {contract.contractStatus === 'APPROVED' && (
                <p>This contract has been fully approved and is ready for signing.</p>
              )}
              {contract.contractStatus === 'SIGNED' && (
                <p>This contract has been signed and can now be executed.</p>
              )}
              {contract.contractStatus === 'EXECUTING' && (
                <p>This contract is currently being executed. You can mark it complete or put it on hold if needed.</p>
              )}
              {contract.contractStatus === 'COMPLETED' && (
                <p>This contract has been successfully completed.</p>
              )}
              {contract.contractStatus === 'ON_HOLD' && (
                <p>This contract is currently on hold. You can resume execution when ready.</p>
              )}
              {contract.contractStatus === 'TERMINATED' && (
                <p>This contract has been terminated and cannot be resumed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
