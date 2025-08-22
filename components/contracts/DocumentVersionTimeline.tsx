"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Edit3, 
  History, 
  User, 
  Calendar,
  GitBranch,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

interface DocumentVersionTimelineProps {
  versions: DocumentVersion[];
  currentVersion: number;
  onVersionSelect?: (version: DocumentVersion) => void;
  onVersionRestore?: (version: DocumentVersion) => void;
  onVersionCompare?: (version1: DocumentVersion, version2: DocumentVersion) => void;
}

export default function DocumentVersionTimeline({
  versions,
  currentVersion,
  onVersionSelect,
  onVersionRestore,
  onVersionCompare
}: DocumentVersionTimelineProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<DocumentVersion | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<DocumentVersion | null>(null);

  const handleVersionSelect = (version: DocumentVersion) => {
    setSelectedVersion(version);
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const handleVersionRestore = (version: DocumentVersion) => {
    if (onVersionRestore) {
      onVersionRestore(version);
    }
  };

  const handleVersionCompare = () => {
    if (compareVersion1 && compareVersion2 && onVersionCompare) {
      onVersionCompare(compareVersion1, compareVersion2);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'REJECTED': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Edit3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeIcon = (changeCount: number) => {
    if (changeCount === 0) return <FileText className="w-4 h-4 text-gray-400" />;
    if (changeCount < 10) return <Edit3 className="w-4 h-4 text-blue-400" />;
    if (changeCount < 50) return <Edit3 className="w-4 h-4 text-orange-400" />;
    return <Edit3 className="w-4 h-4 text-red-400" />;
  };

  const getChangeTypeColor = (changeCount: number) => {
    if (changeCount === 0) return 'bg-gray-100 text-gray-800';
    if (changeCount < 10) return 'bg-blue-100 text-blue-800';
    if (changeCount < 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const sortedVersions = [...versions].sort((a, b) => {
    if (a.version !== b.version) return b.version - a.version;
    return b.revisionNumber - a.revisionNumber;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Version History</h3>
          <p className="text-sm text-gray-600">
            Track changes and manage document versions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
            className="text-purple-600 hover:text-purple-700"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            {compareMode ? 'Cancel Compare' : 'Compare Versions'}
          </Button>
        </div>
      </div>

      {/* Compare Mode Controls */}
      {compareMode && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Version 1 (From)
                </label>
                <select
                  className="w-full p-2 border border-purple-300 rounded-md text-sm"
                  onChange={(e) => {
                    const version = versions.find(v => v.id === e.target.value);
                    setCompareVersion1(version || null);
                  }}
                >
                  <option value="">Select version...</option>
                  {sortedVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.version}.{version.revisionNumber} - {new Date(version.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Version 2 (To)
                </label>
                <select
                  className="w-full p-2 border border-purple-300 rounded-md text-sm"
                  onChange={(e) => {
                    const version = versions.find(v => v.id === e.target.value);
                    setCompareVersion2(version || null);
                  }}
                >
                  <option value="">Select version...</option>
                  {sortedVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.version}.{version.revisionNumber} - {new Date(version.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={handleVersionCompare}
                disabled={!compareVersion1 || !compareVersion2}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Compare
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version Timeline */}
      <div className="space-y-4">
        {sortedVersions.map((version, index) => (
          <Card 
            key={version.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedVersion?.id === version.id ? 'ring-2 ring-purple-500' : ''
            } ${version.version === currentVersion ? 'border-purple-300 bg-purple-50' : ''}`}
            onClick={() => handleVersionSelect(version)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {/* Version Icon */}
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <History className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                
                {/* Version Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      Version {version.version}.{version.revisionNumber}
                    </h4>
                    
                    {version.version === currentVersion && (
                      <Badge variant="default" className="bg-purple-100 text-purple-800">
                        Current
                      </Badge>
                    )}
                    
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(version.status)}
                    >
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(version.status)}
                        <span>{version.status}</span>
                      </div>
                    </Badge>
                    
                    <Badge 
                      variant="secondary" 
                      className={getChangeTypeColor(version.changeCount)}
                    >
                      <div className="flex items-center space-x-1">
                        {getChangeTypeIcon(version.changeCount)}
                        <span>{version.changeCount} changes</span>
                      </div>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">
                    {version.changeDescription}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{version.createdBy}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(version.createdAt).toLocaleString()}</span>
                    </div>
                    
                    {version.approvedBy && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Approved by {version.approvedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVersionSelect(version);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  {version.version !== currentVersion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVersionRestore(version);
                      }}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Change Summary */}
              {version.changeSummary && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Summary:</span> {version.changeSummary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Version Details */}
      {selectedVersion && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">
              Version {selectedVersion.version}.{selectedVersion.revisionNumber} Details
            </CardTitle>
            <CardDescription>
              Created on {new Date(selectedVersion.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Created By</p>
                <p className="text-sm text-gray-900">{selectedVersion.createdBy}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <Badge className={getStatusColor(selectedVersion.status)}>
                  {selectedVersion.status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Change Count</p>
                <p className="text-sm text-gray-900">{selectedVersion.changeCount} changes</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Requires Approval</p>
                <p className="text-sm text-gray-900">
                  {selectedVersion.requiresApproval ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Content Preview</p>
              <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                  {selectedVersion.content.substring(0, 300)}
                  {selectedVersion.content.length > 300 ? '...' : ''}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
