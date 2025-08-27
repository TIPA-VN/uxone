"use client";

import React, { useState } from 'react';
import { Project } from '@/types';
import { 
  Plus, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AddendumCreatorProps {
  project: Project;
  onAddendumCreated?: (addendum: any) => void;
  onCancel?: () => void;
}

export default function AddendumCreator({ 
  project, 
  onAddendumCreated,
  onCancel 
}: AddendumCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    contractType: project.contractDetails?.contractType || '',
    counterparty: project.contractDetails?.counterparty || '',
    value: project.contractDetails?.value?.toString() || '',
    currency: project.contractDetails?.currency || 'USD',
    startDate: '',
    endDate: '',
    effectiveDate: '',
    expirationDate: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      if (!project.contractDetails?.id) {
        throw new Error('Contract ID not found');
      }

      const response = await fetch(`/api/contracts/${project.contractDetails.id}/addendums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create addendum');
      }

      setSuccess('Addendum created successfully!');
      
      // Redirect to the new addendum project
      if (data.addendum?.project?.id) {
        setTimeout(() => {
          window.location.href = `/lvm/projects/${data.addendum.project.id}?tab=contract`;
        }, 1000);
      } else if (onAddendumCreated) {
        onAddendumCreated(data.addendum);
      }

      // Reset form
      setFormData({
        description: '',
        contractType: project.contractDetails?.contractType || '',
        counterparty: project.contractDetails?.counterparty || '',
        value: project.contractDetails?.value?.toString() || '',
        currency: project.contractDetails?.currency || 'USD',
        startDate: '',
        endDate: '',
        effectiveDate: '',
        expirationDate: ''
      });

    } catch (error) {
      console.error('Error creating addendum:', error);
      setError(error instanceof Error ? error.message : 'Failed to create addendum');
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateAddendum = project.contractDetails?.contractStatus === 'COMPLETED' || 
                           project.contractDetails?.contractStatus === 'SIGNED';

  if (!canCreateAddendum) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Addendums Not Available</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Addendums can only be created for completed or signed contracts. 
              Current status: <span className="font-medium">{project.contractDetails?.contractStatus}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Plus className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Create Addendum</h3>
          <p className="text-sm text-gray-600">
            Create an addendum to contract {project.contractDetails?.contractNumber}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateAddendum} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Contract Type
            </label>
            <select
              value={formData.contractType}
              onChange={(e) => handleInputChange('contractType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select contract type</option>
              <option value="PURCHASE_CONTRACT">Purchase Contract</option>
              <option value="SERVICE_AGREEMENT">Service Agreement</option>
              <option value="NDA">Non-Disclosure Agreement</option>
              <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Describe what this addendum modifies or adds to the original contract..."
          />
        </div>

        {/* Contract Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Counterparty
            </label>
            <input
              type="text"
              value={formData.counterparty}
              onChange={(e) => handleInputChange('counterparty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Counterparty name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Value
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="USD">USD</option>
                <option value="THB">THB</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Effective Date
            </label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Expiration Date
            </label>
            <input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => handleInputChange('expirationDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isCreating || !formData.description}
            className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {isCreating ? 'Creating...' : 'Create Addendum'}
          </button>
        </div>
      </form>
    </div>
  );
}
