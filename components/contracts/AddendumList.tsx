"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Building,
  ExternalLink,
  Plus,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface AddendumListProps {
  project: Project;
  onAddAddendum?: () => void;
}

interface Addendum {
  id: string;
  contractNumber: string;
  contractTitle: string;
  contractStatus: string;
  contractType: string;
  counterparty: string;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  effectiveDate: string;
  expirationDate: string;
  addendumNumber: number;
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
  currentApprover: {
    name: string;
    username: string;
  } | null;
}

export default function AddendumList({ project, onAddAddendum }: AddendumListProps) {
  const [addendums, setAddendums] = useState<Addendum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddendums = useCallback(async () => {
    if (!project.contractDetails?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${project.contractDetails.id}/addendums`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch addendums');
      }

      const data = await response.json();
      setAddendums(data.addendums || []);
    } catch (error) {
      console.error('Error fetching addendums:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch addendums');
    } finally {
      setLoading(false);
    }
  }, [project.contractDetails?.id]);

  useEffect(() => {
    fetchAddendums();
  }, [fetchAddendums]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SIGNED': return 'bg-indigo-100 text-indigo-800';
      case 'EXECUTING': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading addendums...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contract Addendums</h3>
              <p className="text-sm text-gray-600">
                {addendums.length} addendum{addendums.length !== 1 ? 's' : ''} for {project.contractDetails?.contractNumber}
              </p>
            </div>
          </div>
          
          {onAddAddendum && (
            <button
              onClick={onAddAddendum}
              className="inline-flex items-center px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Addendum
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {addendums.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No addendums yet</h4>
            <p className="text-xs text-gray-600 mb-4">
              Create addendums to modify or extend this contract
            </p>
            {onAddAddendum && (
              <button
                onClick={onAddAddendum}
                className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create First Addendum
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {addendums.map((addendum) => (
              <div
                key={addendum.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Addendum {addendum.addendumNumber}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(addendum.contractStatus)}`}>
                          {addendum.contractStatus}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {addendum.contractTitle}
                    </h4>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      Contract: <span className="font-mono">{addendum.contractNumber}</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <Building className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {addendum.contractType?.replace('_', ' ') || 'Unknown Type'}
                        </span>
                      </div>
                      
                      {addendum.counterparty && (
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{addendum.counterparty}</span>
                        </div>
                      )}
                      
                      {addendum.value && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            {formatCurrency(addendum.value, addendum.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                      {addendum.effectiveDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            Effective: {formatDate(addendum.effectiveDate)}
                          </span>
                        </div>
                      )}
                      
                      {addendum.expirationDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            Expires: {formatDate(addendum.expirationDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/lvm/projects/${addendum.project.id}?tab=contract`}
                      className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Addendum
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
