"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Building,
  ExternalLink,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import AddendumCreator from './AddendumCreator';

interface ContractAddendumManagerProps {
  project: Project;
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

export default function ContractAddendumManager({ project }: ContractAddendumManagerProps) {
  const [addendums, setAddendums] = useState<Addendum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddendumCreator, setShowAddendumCreator] = useState(false);

  useEffect(() => {
    fetchAddendums();
  }, [project.contractDetails?.id]);

  const fetchAddendums = async () => {
    if (!project.contractDetails?.id) return;

    // If this is an addendum, get addendums for the parent contract
    // If this is a parent contract, get addendums for this contract
    const contractId = project.contractDetails.isAddendum && project.contractDetails.parentContract?.id
      ? project.contractDetails.parentContract.id
      : project.contractDetails.id;

    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contractId}/addendums`);
      
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
  };

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
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/lvm/projects/${
                  project.contractDetails?.isAddendum && project.contractDetails?.parentContract?.project?.id
                    ? project.contractDetails.parentContract.project.id
                    : project.id
                }?tab=contract`}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to {project.contractDetails?.isAddendum ? 'Parent Contract' : 'Contract'}
              </Link>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contract Addendums</h3>
                  <p className="text-sm text-gray-600">
                    {addendums.length} addendum{addendums.length !== 1 ? 's' : ''} for {
                      project.contractDetails?.isAddendum && project.contractDetails?.parentContract?.contractNumber
                        ? project.contractDetails.parentContract.contractNumber
                        : project.contractDetails?.contractNumber
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddendumCreator(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Addendum
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showAddendumCreator ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Create New Addendum</h4>
                <button
                  onClick={() => setShowAddendumCreator(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
              <AddendumCreator
                project={project}
                onAddendumCreated={(addendum) => {
                  setShowAddendumCreator(false);
                  fetchAddendums(); // Refresh the list
                }}
                onCancel={() => setShowAddendumCreator(false)}
              />
            </div>
          ) : addendums.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No addendums yet</h4>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Create addendums to modify or extend this contract. Each addendum becomes an independent project with its own workflow.
              </p>
              <button
                onClick={() => setShowAddendumCreator(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Addendum
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addendums.map((addendum) => (
                <div
                  key={addendum.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            Addendum {addendum.addendumNumber}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(addendum.contractStatus)}`}>
                            {addendum.contractStatus}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {addendum.contractTitle}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Counterparty</p>
                            <p className="text-sm font-medium text-gray-900">{addendum.counterparty}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Value</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(addendum.value, addendum.currency)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(addendum.startDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">End Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(addendum.endDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Created: {formatDate(addendum.createdAt)}</span>
                          {addendum.currentApprover && (
                            <span>Approver: {addendum.currentApprover.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                                          <Link
                      href={`/lvm/projects/${addendum.project.id}?tab=contract`}
                      className="inline-flex items-center px-3 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
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
    </div>
  );
}
