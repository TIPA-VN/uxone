"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { useContract } from '@/hooks/useContract';
import { 
  FileText, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit3,
  Download,
  Share2
} from 'lucide-react';

interface ContractTabProps {
  project: Project;
  onUpdateContract?: (updates: Partial<{
    contractType: string;
    counterparty: string;
    value: number | null;
    currency: string;
    contractStatus: string;
  }>) => void;
}

export default function ContractTab({ project, onUpdateContract }: ContractTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    contractType: project.contractDetails?.contractType || '',
    counterparty: project.contractDetails?.counterparty || '',
    value: project.contractDetails?.value?.toString() || '',
    currency: project.contractDetails?.currency || 'THB',
    contractStatus: project.contractDetails?.contractStatus || 'DRAFT'
  });

  const { updateContract, loading, error } = useContract();



  // Update local form state when contract data changes
  useEffect(() => {
    if (project.contractDetails) {
      setEditForm({
        contractType: project.contractDetails.contractType || '',
        counterparty: project.contractDetails.counterparty || '',
        value: project.contractDetails.value?.toString() || '',
        currency: project.contractDetails.currency || 'THB',
        contractStatus: project.contractDetails.contractStatus || 'DRAFT'
      });
    }
  }, [project.contractDetails?.contractType, project.contractDetails?.counterparty, project.contractDetails?.value, project.contractDetails?.currency, project.contractDetails?.contractStatus]);

  if (!project.contractDetails) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Contract Details</h3>
        <p className="mt-1 text-sm text-gray-500">
          This project doesn't have contract details yet.
        </p>
      </div>
    );
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
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'SIGNED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXECUTING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSave = async () => {
    const updates = {
      ...editForm,
      value: editForm.value ? parseFloat(editForm.value) : undefined
    };

    const updatedContract = await updateContract(project.id, updates);
    
    if (updatedContract) {
      // Update the local contract state with the returned data
      if (onUpdateContract) {
        onUpdateContract(updatedContract);
      }
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      contractType: contract.contractType || '',
      counterparty: contract.counterparty || '',
      value: contract.value?.toString() || '',
      currency: contract.currency || 'THB',
      contractStatus: contract.contractStatus || 'DRAFT'
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contract Management</h2>
          <p className="text-sm text-gray-600">
            Manage contract details and workflow for {project.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {!isEditing && (
            <>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error updating contract</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Status Banner */}
      <div className={`rounded-lg border p-4 ${getStatusColor(contract.contractStatus || 'DRAFT')}`}>
        <div className="flex items-center">
          {getStatusIcon(contract.contractStatus || 'DRAFT')}
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              Contract Status: {contract.contractStatus || 'DRAFT'}
            </h3>
            <p className="text-sm opacity-90">
              {contract.contractStatus === 'DRAFT' && 'Contract is in draft mode and can be edited'}
              {contract.contractStatus === 'REVIEW' && 'Contract is under review by stakeholders'}
              {contract.contractStatus === 'APPROVED' && 'Contract has been approved and is ready for execution'}
              {contract.contractStatus === 'SIGNED' && 'Contract has been signed by all parties'}
              {contract.contractStatus === 'EXECUTING' && 'Contract is currently being executed'}
              {contract.contractStatus === 'COMPLETED' && 'Contract has been completed successfully'}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Contract Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type
              </label>
              {isEditing ? (
                <select
                  value={editForm.contractType}
                  onChange={(e) => setEditForm({ ...editForm, contractType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select contract type</option>
                  <option value="PURCHASE_CONTRACT">Purchase Contract</option>
                  <option value="SERVICE_AGREEMENT">Service Agreement</option>
                  <option value="LICENSE_AGREEMENT">License Agreement</option>
                  <option value="PARTNERSHIP_AGREEMENT">Partnership Agreement</option>
                  <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                  <option value="LEASE_AGREEMENT">Lease Agreement</option>
                </select>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">
                    {contract.contractType || 'Not specified'}
                  </span>
                </div>
              )}
            </div>

            {/* Counterparty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Counterparty
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.counterparty}
                  onChange={(e) => setEditForm({ ...editForm, counterparty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter counterparty name"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">
                    {contract.counterparty || 'Not specified'}
                  </span>
                </div>
              )}
            </div>

            {/* Contract Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Value
              </label>
              {isEditing ? (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={editForm.value}
                    onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter value"
                  />
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="THB">THB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">
                    {contract.value ? `${contract.value.toLocaleString()} ${contract.currency}` : 'Not specified'}
                  </span>
                </div>
              )}
            </div>

            {/* Contract Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Status
              </label>
              {isEditing ? (
                <select
                  value={editForm.contractStatus}
                  onChange={(e) => setEditForm({ ...editForm, contractStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="SIGNED">Signed</option>
                  <option value="EXECUTING">Executing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  {getStatusIcon(contract.contractStatus || 'DRAFT')}
                  <span className="text-sm text-gray-900 ml-3">
                    {contract.contractStatus || 'Draft'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contract Number */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Number
            </label>
            <div className="flex items-center p-3 bg-gray-50 rounded-md">
              <FileText className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-sm font-mono text-gray-900">
                {contract.contractNumber || 'Not generated yet'}
              </span>
            </div>
          </div>

          {/* Action Buttons for Editing */}
          {isEditing && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contract Workflow */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Contract Workflow
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Draft Created</p>
                  <p className="text-sm text-gray-500">Contract has been drafted</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">Completed</span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              contract.contractStatus === 'REVIEW' || contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <Clock className={`w-5 h-5 mr-3 ${
                  contract.contractStatus === 'REVIEW' || contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                    ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Under Review</p>
                  <p className="text-sm text-gray-500">Stakeholders are reviewing the contract</p>
                </div>
              </div>
              <span className={`text-xs ${
                contract.contractStatus === 'REVIEW' || contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                  ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {contract.contractStatus === 'REVIEW' ? 'In Progress' : 
                 contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <CheckCircle className={`w-5 h-5 mr-3 ${
                  contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                    ? 'text-green-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Approved</p>
                  <p className="text-sm text-gray-500">Contract has been approved</p>
                </div>
              </div>
              <span className={`text-xs ${
                contract.contractStatus === 'APPROVED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                  ? 'text-green-500' : 'text-gray-500'
              }`}>
                {contract.contractStatus === 'APPROVED' ? 'In Progress' : 
                 contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                ? 'bg-indigo-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <CheckCircle className={`w-5 h-5 mr-3 ${
                  contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                    ? 'text-indigo-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Signed</p>
                  <p className="text-sm text-gray-500">Contract has been signed by all parties</p>
                </div>
              </div>
              <span className={`text-xs ${
                contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                  ? 'text-indigo-500' : 'text-gray-500'
              }`}>
                {contract.contractStatus === 'SIGNED' ? 'In Progress' : 
                 contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                ? 'bg-purple-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <Clock className={`w-5 h-5 mr-3 ${
                  contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                    ? 'text-purple-500' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Executing</p>
                  <p className="text-sm text-gray-500">Contract is being executed</p>
                </div>
              </div>
              <span className={`text-xs ${
                contract.contractStatus === 'EXECUTING' || contract.contractStatus === 'COMPLETED'
                  ? 'text-purple-500' : 'text-gray-500'
              }`}>
                {contract.contractStatus === 'EXECUTING' ? 'In Progress' : 
                 contract.contractStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg ${
              contract.contractStatus === 'COMPLETED'
                ? 'bg-gray-100' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <CheckCircle className={`w-5 h-5 mr-3 ${
                  contract.contractStatus === 'COMPLETED'
                    ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Completed</p>
                  <p className="text-sm text-gray-500">Contract has been completed</p>
                </div>
              </div>
              <span className={`text-xs ${
                contract.contractStatus === 'COMPLETED'
                  ? 'text-gray-600' : 'text-gray-500'
              }`}>
                {contract.contractStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
