"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, Hash, FileText, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface FinalizedDocumentAuditActionsProps {
  contractId: string;
  title: string;
  checksum: string;
}

export default function FinalizedDocumentAuditActions({ 
  contractId, 
  title, 
  checksum 
}: FinalizedDocumentAuditActionsProps) {
  
  const handleDownload = (format: string = 'pdf') => {
    if (format === 'pdf') {
      const link = document.createElement('a');
      link.href = `/api/contracts/${contractId}/finalized/download`;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Download in other formats
      const link = document.createElement('a');
      link.href = `/api/contracts/${contractId}/finalized/download-format?format=${format}&contractId=${contractId}`;
      link.download = `${title}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyChecksum = async () => {
    try {
      await navigator.clipboard.writeText(checksum);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy checksum:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex space-x-3">
      <Button
        variant="outline"
        onClick={handleGoBack}
      >
        <Eye className="w-4 h-4 mr-2" />
        Back to Document
      </Button>
      
                <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download
                <ChevronDown className="w-4 h-4 ml-2" />
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
          
          <Button
            variant="outline"
            onClick={handlePrint}
          >
            <FileText className="w-4 h-4 mr-2" />
            Print Report
          </Button>
    </div>
  );
}


