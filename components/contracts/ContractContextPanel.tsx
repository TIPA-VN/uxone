"use client";

import React from 'react';
import { Project } from '@/types';
import { 
  FileText, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ContractContextPanelProps {
  project: Project;
  onViewContract?: () => void;
}

export default function ContractContextPanel({ project, onViewContract }: ContractContextPanelProps) {
  if (!project.contractDetails) {
    return null;
  }

  const contract = project.contractDetails;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'REVIEW': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'SIGNED': return <CheckCircle className="w-4 h-4 text-indigo-500" />;
      case 'EXECUTING': return <Clock className="w-4 h-4 text-purple-500" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SIGNED': return 'bg-indigo-100 text-indigo-800';
      case 'EXECUTING': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <FileText className="w-4 h-4 text-purple-500 mr-2" />
            Contract Overview
          </h3>
          {onViewContract && (
            <button
              onClick={onViewContract}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
            >
              View Details
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Contract Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.contractStatus || 'DRAFT')}`}>
            {getStatusIcon(contract.contractStatus || 'DRAFT')}
            <span className="ml-1">{contract.contractStatus || 'Draft'}</span>
          </span>
        </div>

        {/* Contract Type */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Type</span>
          <span className="text-xs text-gray-900 font-medium">
            {contract.contractType ? 
              contract.contractType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
              'Not specified'
            }
          </span>
        </div>

        {/* Counterparty */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Counterparty</span>
          <span className="text-xs text-gray-900 font-medium flex items-center">
            <User className="w-3 h-3 text-gray-400 mr-1" />
            {contract.counterparty || 'Not specified'}
          </span>
        </div>

        {/* Contract Value */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Value</span>
          <span className="text-xs text-gray-900 font-medium flex items-center">
            <DollarSign className="w-3 h-3 text-gray-400 mr-1" />
            {contract.value ? 
              `${contract.value.toLocaleString()} ${contract.currency}` : 
              'Not specified'
            }
          </span>
        </div>

        {/* Contract Number */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Number</span>
          <span className="text-xs font-mono text-gray-900">
            {contract.contractNumber || 'Not generated'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors">
            Edit Contract
          </button>
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
