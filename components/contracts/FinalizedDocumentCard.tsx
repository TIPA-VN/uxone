"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  User,
  DollarSign,
  Building,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FinalizedDocument {
  id: string;
  title: string;
  contractNumber: string;
  finalizedContent: string;
  finalizedPdf: string;
  digitalSignature: string;
  checksum: string;
  approvedBy: string[];
  approvedAt: string;
  isLegallyBinding: boolean;
  finalizationNotes: string;
  version: number;
  revisionNumber: number;
}

interface FinalizedDocumentCardProps {
  finalizedDocument: FinalizedDocument;
  contractDetails: {
    contractType?: string;
    counterparty?: string;
    value?: number;
    currency?: string;
    contractStatus?: string;
  };
  onDownloadPDF?: (pdfData: string) => void;
  onVerifySignature?: (signature: string) => void;
}

export default function FinalizedDocumentCard({
  finalizedDocument,
  contractDetails,
  onDownloadPDF,
  onVerifySignature
}: FinalizedDocumentCardProps) {
  const [showContent, setShowContent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!finalizedDocument.finalizedPdf) return;
    
    setIsDownloading(true);
    try {
      if (onDownloadPDF) {
        onDownloadPDF(finalizedDocument.finalizedPdf);
      } else {
        // Default PDF download behavior
        const link = document.createElement('a');
        link.href = finalizedDocument.finalizedPdf;
        link.download = `${finalizedDocument.contractNumber}-finalized.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVerifySignature = () => {
    if (onVerifySignature && finalizedDocument.digitalSignature) {
      onVerifySignature(finalizedDocument.digitalSignature);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SIGNED': return 'bg-blue-100 text-blue-800';
      case 'EXECUTING': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'SIGNED': return <Shield className="w-4 h-4" />;
      case 'EXECUTING': return <Building className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {finalizedDocument.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Contract #{finalizedDocument.contractNumber}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(contractDetails.contractStatus || 'DRAFT')} font-medium`}
          >
            <div className="flex items-center space-x-1">
              {getStatusIcon(contractDetails.contractStatus || 'DRAFT')}
              <span>{contractDetails.contractStatus || 'DRAFT'}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contract Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-medium">{contractDetails.contractType || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Counterparty</p>
              <p className="text-sm font-medium">{contractDetails.counterparty || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Value</p>
              <p className="text-sm font-medium">
                {contractDetails.value ? `${contractDetails.value} ${contractDetails.currency}` : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-sm font-medium">
                {new Date(finalizedDocument.approvedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Document Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Document Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Version</p>
              <p className="text-sm font-medium">{finalizedDocument.version}.{finalizedDocument.revisionNumber}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Checksum</p>
              <p className="text-xs font-mono text-gray-700 truncate" title={finalizedDocument.checksum}>
                {finalizedDocument.checksum.substring(0, 16)}...
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Legally Binding</p>
              <p className="text-sm font-medium">
                {finalizedDocument.isLegallyBinding ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Approval Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Approval Details</h4>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Approved by {finalizedDocument.approvedBy.length} approver(s)</span>
            </div>
            <p className="text-sm text-green-700">
              {finalizedDocument.approvedBy.join(', ')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Finalized on {new Date(finalizedDocument.approvedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <Separator />

        {/* Document Content Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Document Content</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContent(!showContent)}
              className="text-purple-600 hover:text-purple-700"
            >
              {showContent ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Content
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Content
                </>
              )}
            </Button>
          </div>
          
          {showContent && (
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {finalizedDocument.finalizedContent}
              </pre>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading || !finalizedDocument.finalizedPdf}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleVerifySignature}
            disabled={!finalizedDocument.digitalSignature}
            className="flex-1"
          >
            <Shield className="w-4 h-4 mr-2" />
            Verify Signature
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Audit functionality is now integrated into the project's contract tab
              // The user can view audit information directly in the project view
              if (finalizedDocument.originalDocument?.contractDetails?.id) {
                window.location.href = `/lvm/projects/${finalizedDocument.originalDocument.contractDetails.id}`;
              }
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Project
          </Button>
        </div>

        {/* Notes */}
        {finalizedDocument.finalizationNotes && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 font-medium mb-1">Notes</p>
            <p className="text-sm text-blue-700">{finalizedDocument.finalizationNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
