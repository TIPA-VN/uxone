"use client";

import React from 'react';
import { 
  FileText, 
  Download, 
  Eye,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface FinalizedDocumentOverviewCardProps {
  doc: {
    id: string;
    title: string;
    contractNumber: string | null;
    version: number;
    revisionNumber: number;
    finalizedPdf: string | null;
    approvedBy: string[];
    finalizationDate: Date;
    checksum: string;
    isLegallyBinding: boolean;
    digitalSignature: string | null;
    originalDocument: {
      contractDetails: {
        id: string;
      } | null;
    };
  };
  signatureStatus: {
    status: string;
    label: string;
    color: string;
  };
  formatFileSize: (base64String: string | null) => string;
  formatDate: (date: Date) => string;
}

export default function FinalizedDocumentOverviewCard({
  doc,
  signatureStatus,
  formatFileSize,
  formatDate
}: FinalizedDocumentOverviewCardProps) {
  
  const handleDownload = (format: string = 'pdf') => {
    if (!doc.originalDocument.contractDetails?.id) return;
    
    if (format === 'pdf') {
      const link = document.createElement('a');
      link.href = `/api/contracts/${doc.originalDocument.contractDetails.id}/finalized/download`;
      link.download = `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Download in other formats
      const link = document.createElement('a');
      link.href = `/api/contracts/${doc.originalDocument.contractDetails.id}/finalized/download-format?format=${format}&contractId=${doc.originalDocument.contractDetails.id}`;
      link.download = `${doc.title}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium text-gray-900 truncate">
                {doc.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {doc.contractNumber || 'No Contract Number'}
              </CardDescription>
            </div>
          </div>
          <Badge className={signatureStatus.color}>
            {signatureStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Document Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Version:</span>
            <p className="font-medium">{doc.version}.{doc.revisionNumber}</p>
          </div>
          <div>
            <span className="text-gray-500">Size:</span>
            <p className="font-medium">{formatFileSize(doc.finalizedPdf)}</p>
          </div>
          <div>
            <span className="text-gray-500">Approved:</span>
            <p className="font-medium">{doc.approvedBy.length} user{doc.approvedBy.length !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <span className="text-gray-500">Finalized:</span>
            <p className="font-medium">{formatDate(doc.finalizationDate)}</p>
          </div>
        </div>

        {/* Security Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Checksum:</span>
            <span className="font-mono text-gray-700">
              {doc.checksum.substring(0, 8)}...
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Legal Binding:</span>
            <Badge variant={doc.isLegallyBinding ? "default" : "secondary"} className="text-xs">
              {doc.isLegallyBinding ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!doc.originalDocument.contractDetails?.id}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF Format
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('html')}>
                <FileText className="w-4 h-4 mr-2" />
                HTML Format
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('txt')}>
                <FileText className="w-4 h-4 mr-2" />
                Plain Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('md')}>
                <FileText className="w-4 h-4 mr-2" />
                Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('json')}>
                <FileText className="w-4 h-4 mr-2" />
                JSON (with metadata)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <a href={`/lvm/contracts/finalized/${doc.id}/audit`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-1" />
              Audit
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
