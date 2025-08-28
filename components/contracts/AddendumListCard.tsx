"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { FileText, Calendar, CheckCircle, Clock, AlertTriangle, Ban } from 'lucide-react';
import Link from 'next/link';

interface AddendumListCardProps {
  parentProject: Project;
  embedded?: boolean; // When true, renders without its own card styling
}

interface AddendumData {
  id: string;
  name: string;
  contractNumber: string;
  addendumNumber: number;
  contractStatus: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    documentNumber?: string; // Add document number for project number
  };
}

export default function AddendumListCard({ parentProject, embedded = false }: AddendumListCardProps) {
  const [addendums, setAddendums] = useState<AddendumData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddendums();
  }, [parentProject.id]);

  const fetchAddendums = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/${parentProject.contractDetails?.id}/addendums`);
      if (res.ok) {
        const data = await res.json();
        setAddendums(data.addendums || []);
      }
    } catch (error) {
      console.error('Error fetching addendums:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'SIGNED':
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'REVIEW':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'DRAFT':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'TERMINATED':
        return <Ban className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-700 bg-green-100';
      case 'SIGNED':
      case 'APPROVED':
        return 'text-blue-700 bg-blue-100';
      case 'REVIEW':
        return 'text-yellow-700 bg-yellow-100';
      case 'DRAFT':
        return 'text-gray-700 bg-gray-100';
      case 'TERMINATED':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-orange-700 bg-orange-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const containerClass = embedded 
    ? "" 
    : "bg-white rounded-xl shadow-sm border border-gray-200";
  
  const headerClass = embedded 
    ? "pb-4 border-b border-gray-200" 
    : "p-4 border-b border-gray-200";
    
  const contentClass = embedded 
    ? "" 
    : "p-4";

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contract Addendums</h3>
            {addendums.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {addendums.length}
              </span>
            )}
          </div>
          <Link
            href={`/lvm/projects/addendums/${parentProject.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Manage
          </Link>
        </div>
      </div>

      <div className={contentClass}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading addendums...</span>
          </div>
        ) : addendums.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-3">No addendums created yet</p>
            <Link
              href={`/lvm/projects/addendums/${parentProject.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Manage Addendums
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {addendums.map((addendum) => (
              <div
                key={addendum.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {addendum.contractNumber}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(addendum.createdAt)}</span>
                    </div>
                    {addendum.project?.documentNumber && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-blue-600">
                          Project: {addendum.project.documentNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(addendum.contractStatus)}`}>
                    {getStatusIcon(addendum.contractStatus)}
                    <span className="ml-1">{addendum.contractStatus}</span>
                  </div>
                                                <Link
                                href={`/lvm/projects/${addendum.project?.id}`}
                                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                              >
                                View
                              </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
