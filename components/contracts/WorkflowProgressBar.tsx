"use client";

import React from 'react';
import { CheckCircle, Clock, User, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApprovalLevel {
  level: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  comments?: string;
}

interface WorkflowProgressBarProps {
  currentLevel: number;
  totalLevels: number;
  approvalHistory: ApprovalLevel[];
  currentApproverId?: string;
  currentApproverName?: string;
  contractStatus: string;
}

export default function WorkflowProgressBar({
  currentLevel,
  totalLevels,
  approvalHistory,
  currentApproverId,
  currentApproverName,
  contractStatus
}: WorkflowProgressBarProps) {
  const getLevelStatus = (level: number): 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' => {
    if (level < currentLevel) return 'APPROVED';
    if (level === currentLevel) return 'PENDING';
    return 'PENDING';
  };

  const getLevelIcon = (level: number, status: string) => {
    if (status === 'APPROVED') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status === 'REJECTED') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    } else if (level === currentLevel) {
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    } else {
      return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLevelColor = (level: number, status: string) => {
    if (status === 'APPROVED') {
      return 'bg-green-500';
    } else if (status === 'REJECTED') {
      return 'bg-red-500';
    } else if (level === currentLevel) {
      return 'bg-blue-500';
    } else {
      return 'bg-gray-300';
    }
  };

  const getApproverName = (level: number) => {
    const approval = approvalHistory.find(a => a.level === level);
    if (approval?.approverName) return approval.approverName;
    
    // Default approver names based on level
    switch (level) {
      case 1: return 'Project Manager';
      case 2: return 'Department Head';
      case 3: return 'Executive';
      default: return `Level ${level} Approver`;
    }
  };

  const getLevelDescription = (level: number) => {
    switch (level) {
      case 1: return 'Initial Review';
      case 2: return 'Department Approval';
      case 3: return 'Executive Approval';
      default: return `Level ${level} Review`;
    }
  };

  const getEstimatedTime = (level: number) => {
    // Estimate time based on level and current status
    if (level < currentLevel) return 'Completed';
    if (level === currentLevel) {
      switch (level) {
        case 1: return '1-2 business days';
        case 2: return '2-3 business days';
        case 3: return '3-5 business days';
        default: return '1-2 business days';
      }
    }
    return 'Pending';
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Approval Workflow</h3>
          <p className="text-sm text-gray-600">
            Current Status: <span className="font-medium">{contractStatus}</span>
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">Progress</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round((currentLevel / totalLevels) * 100)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalLevels }, (_, index) => {
            const level = index + 1;
            const status = getLevelStatus(level);
            const isCurrent = level === currentLevel;
            const isCompleted = level < currentLevel;
            
            return (
              <div key={level} className="flex flex-col items-center space-y-2">
                {/* Level Icon */}
                <div className={`relative z-10 ${isCurrent ? 'animate-pulse' : ''}`}>
                  {getLevelIcon(level, status)}
                </div>
                
                {/* Level Label */}
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900">
                    Level {level}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getLevelDescription(level)}
                  </p>
                </div>
                
                {/* Approver Info */}
                <div className="text-center max-w-24">
                  <p className="text-xs text-gray-600 font-medium">
                    {isCurrent && currentApproverName ? currentApproverName : getApproverName(level)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getEstimatedTime(level)}
                  </p>
                </div>
                
                {/* Status Badge */}
                <Badge 
                  variant={status === 'APPROVED' ? 'default' : status === 'REJECTED' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {status}
                </Badge>
              </div>
            );
          })}
        </div>
        
        {/* Progress Line */}
        <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, ((currentLevel - 1) / (totalLevels - 1)) * 100))}%` }}
          />
        </div>
      </div>

      {/* Current Status Details */}
      {currentLevel <= totalLevels && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">
                Awaiting Level {currentLevel} Approval
              </h4>
              <p className="text-sm text-blue-700">
                {currentApproverName || getApproverName(currentLevel)} will review this contract
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Estimated time: {getEstimatedTime(currentLevel)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approval History */}
      {approvalHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Approval History</h4>
          <div className="space-y-2">
            {approvalHistory
              .sort((a, b) => a.level - b.level)
              .map((approval) => (
                <div key={approval.level} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {approval.status === 'APPROVED' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : approval.status === 'REJECTED' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Level {approval.level}: {getLevelDescription(approval.level)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {approval.approverName || getApproverName(approval.level)}
                    </p>
                    {approval.comments && (
                      <p className="text-xs text-gray-500 mt-1">
                        "{approval.comments}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <Badge 
                      variant={approval.status === 'APPROVED' ? 'default' : approval.status === 'REJECTED' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {approval.status}
                    </Badge>
                    {approval.approvedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(approval.approvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
