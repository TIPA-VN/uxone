"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/types';
import { History, AlertCircle, RefreshCw } from 'lucide-react';
import DocumentVersionTimeline from './DocumentVersionTimeline';

interface ContractVersionHistoryProps {
  project: Project;
  onRefresh?: () => void;
}

interface DocumentVersion {
  id: string;
  version: number;
  revisionNumber: number;
  content: string;
  createdAt: string;
  createdBy: string;
  changeDescription: string;
  changeSummary: string;
  changeCount: number;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function ContractVersionHistory({ project, onRefresh }: ContractVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project.contractDetails?.id) {
      fetchVersions();
    }
  }, [project.contractDetails?.id]);

  const fetchVersions = async () => {
    if (!project.contractDetails?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${project.contractDetails.id}/versions`);
      
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
        setCurrentVersion(data.currentVersion || 1);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch versions');
      }
    } catch (err) {
      setError('Error fetching contract versions');
      console.error('Error fetching versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: DocumentVersion) => {
    console.log('Selected version:', version);
    // You can implement version preview functionality here
  };

  const handleVersionRestore = async (version: DocumentVersion) => {
    if (!confirm(`Are you sure you want to restore version ${version.version}.${version.revisionNumber}? This will create a new revision.`)) {
      return;
    }

    try {
      // Create a new revision with the restored content
      const response = await fetch(`/api/contracts/${project.contractDetails?.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: version.content,
          changeSummary: `Restored from version ${version.version}.${version.revisionNumber}`,
          changeCount: 0, // Minor change
          requiresApproval: false
        }),
      });

      if (response.ok) {
        // Refresh versions
        fetchVersions();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to restore version: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      alert('Error restoring version');
    }
  };

  const handleVersionCompare = (version1: DocumentVersion, version2: DocumentVersion) => {
    console.log('Comparing versions:', version1, version2);
    // You can implement version comparison functionality here
    alert(`Version comparison between v${version1.version}.${version1.revisionNumber} and v${version2.version}.${version2.revisionNumber} - Feature coming soon!`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Version History</h3>
        <p className="text-sm text-gray-500">Fetching contract versions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Versions</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchVersions}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Version History</h3>
        <p className="text-sm text-gray-500 mb-4">
          This contract doesn't have any version history yet.
        </p>
        <p className="text-xs text-gray-400">
          Versions will be created automatically when you make changes to the contract document.
        </p>
        <button
          onClick={fetchVersions}
          className="mt-4 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Contract Version History</h3>
          <p className="text-sm text-gray-500">
            {versions.length} version{versions.length !== 1 ? 's' : ''} • Current: v{currentVersion}
          </p>
        </div>
        <button
          onClick={fetchVersions}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Refresh
        </button>
      </div>

      <DocumentVersionTimeline
        versions={versions}
        currentVersion={currentVersion}
        onVersionSelect={handleVersionSelect}
        onVersionRestore={handleVersionRestore}
        onVersionCompare={handleVersionCompare}
      />
    </div>
  );
}
