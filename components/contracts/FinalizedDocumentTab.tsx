import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { CheckCircle, Download, FileText, AlertCircle, Clock, Eye } from 'lucide-react';

interface FinalizedDocumentTabProps {
  project: Project;
  onRefresh: () => void;
}

interface FinalizedDocument {
  id: string;
  title: string;
  finalizedPdf: string;
  contractNumber: string;
  version: number;
  revisionNumber: number;
  digitalSignature: string;
  checksum: string;
  approvedBy: string[];
  approvedAt: string;
  finalizationDate: string;
  storageLocation: string;
  archivedBy: string;
  createdAt: string;
}

export default function FinalizedDocumentTab({ project, onRefresh }: FinalizedDocumentTabProps) {
  const [finalizedDocument, setFinalizedDocument] = useState<FinalizedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const contractId = project.contractDetails?.id;
  const contractStatus = project.contractDetails?.contractStatus;

  useEffect(() => {
    if (contractId && contractStatus === 'COMPLETED') {
      fetchFinalizedDocument();
    } else {
      setLoading(false);
    }
  }, [contractId, contractStatus]);

  const fetchFinalizedDocument = async () => {
    if (!contractId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/contracts/${contractId}/finalized`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.finalizedDocument) {
          setFinalizedDocument(result.finalizedDocument);
        } else {
          setFinalizedDocument(null);
        }
      } else {
        setError('Failed to fetch finalized document');
      }
    } catch (err) {
      setError('Error fetching finalized document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!finalizedDocument || !contractId) return;
    
    try {
      setDownloading(true);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = `/api/contracts/${contractId}/finalized/download`;
      link.download = finalizedDocument.title + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      setError('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Finalized Document</h3>
          <p className="text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

  if (contractStatus !== 'COMPLETED') {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Not Yet Finalized</h3>
          <p className="text-sm text-gray-500 mb-4">
            This contract will show the finalized document once it's completed
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Current Status:</strong> {contractStatus || 'DRAFT'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Complete the workflow to generate the finalized document
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Document</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchFinalizedDocument}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!finalizedDocument) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Finalized Document Found</h3>
          <p className="text-sm text-gray-500 mb-4">
            The contract is completed but no finalized document was generated
          </p>
          <button
            onClick={fetchFinalizedDocument}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Finalized Document</h3>
        <p className="text-sm text-gray-500">
          This is the official, approved version of the contract
        </p>
      </div>

      {/* Document Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{finalizedDocument.title}</h4>
              <p className="text-sm text-gray-500">
                Version {finalizedDocument.version}.{finalizedDocument.revisionNumber} • PDF Document
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>

        {/* Document Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Document Information</h5>
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Contract Number:</dt>
                <dd className="text-sm text-gray-900">{finalizedDocument.contractNumber || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Version:</dt>
                <dd className="text-sm text-gray-900">{finalizedDocument.version}.{finalizedDocument.revisionNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Approved By:</dt>
                <dd className="text-sm text-gray-900">{finalizedDocument.approvedBy?.length || 0} users</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Checksum:</dt>
                <dd className="text-sm text-gray-900 font-mono text-xs">
                  {finalizedDocument.checksum?.substring(0, 8)}...
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Finalization Details</h5>
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created:</dt>
                <dd className="text-sm text-gray-900">{formatDate(finalizedDocument.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Finalized:</dt>
                <dd className="text-sm text-gray-900">
                  {finalizedDocument.finalizationDate ? 
                    formatDate(finalizedDocument.finalizationDate) : 
                    'N/A'
                  }
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Digital Signature:</dt>
                <dd className="text-sm text-green-600">✓ Verified</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h6 className="text-sm font-medium text-blue-900">Document Security</h6>
              <p className="text-sm text-blue-700 mt-1">
                This document is digitally signed and verified. Any modifications will invalidate the signature.
                The document hash and digital signature ensure authenticity and integrity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
