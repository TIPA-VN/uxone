"use client";

import React, { useState } from 'react';
import { Project } from '@/types';
import { 
  Download, 
  FileText, 
  Shield, 
  History,
  CheckSquare,
  X
} from 'lucide-react';

interface ContractExportDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

interface ExportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended: boolean;
}

const exportSections: ExportSection[] = [
  {
    id: 'header',
    label: 'Header & Summary',
    description: 'Contract title, parties, value, and key details',
    icon: <FileText className="w-4 h-4" />,
    recommended: true
  },
  {
    id: 'contract',
    label: 'Contract Content',
    description: 'Terms, conditions, and main contract text',
    icon: <FileText className="w-4 h-4" />,
    recommended: true
  },
  {
    id: 'security',
    label: 'Security & Signatures',
    description: 'Digital signatures, checksums, and verification',
    icon: <Shield className="w-4 h-4" />,
    recommended: false
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    description: 'Approval history, versions, and change log',
    icon: <History className="w-4 h-4" />,
    recommended: false
  }
];

export default function ContractExportDialog({ project, isOpen, onClose }: ContractExportDialogProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(['header', 'contract']);
  const [format, setFormat] = useState<'pdf' | 'html'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      alert('Please select at least one section to export.');
      return;
    }

    setIsExporting(true);
    
    try {
      const response = await fetch(`/api/contracts/${project.contractDetails?.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: selectedSections,
          format: format
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const contractNumber = project.contractDetails?.contractNumber || 'contract';
      const sectionsText = selectedSections.join('-');
      a.download = `${contractNumber}-${sectionsText}.${format}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export contract. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectCustomerVersion = () => {
    setSelectedSections(['header', 'contract']);
  };

  const selectFullVersion = () => {
    setSelectedSections(['header', 'contract', 'security', 'audit']);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Contract</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose which sections to include in your export
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Selection</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={selectCustomerVersion}
                className="flex flex-col items-start p-4 bg-blue-50 border border-blue-200 text-left rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <span className="text-sm font-medium text-blue-900 mb-1">Customer Version</span>
                <span className="text-xs text-blue-600">Header + Contract only</span>
              </button>
              <button
                onClick={selectFullVersion}
                className="flex flex-col items-start p-4 bg-gray-50 border border-gray-200 text-left rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 mb-1">Internal Version</span>
                <span className="text-xs text-gray-600">All sections + audit trail</span>
              </button>
            </div>
          </div>

          {/* Section Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Sections</h3>
            <div className="space-y-3">
              {exportSections.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSections.includes(section.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center">
                    <CheckSquare 
                      className={`w-5 h-5 ${
                        selectedSections.includes(section.id)
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {section.icon}
                      <span className="text-sm font-medium text-gray-900">
                        {section.label}
                      </span>
                      {section.recommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  format === 'pdf'
                    ? 'bg-gray-900 text-white border-gray-900 focus:ring-gray-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Document
              </button>
              <button
                onClick={() => setFormat('html')}
                className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  format === 'html'
                    ? 'bg-gray-900 text-white border-gray-900 focus:ring-gray-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                HTML File
              </button>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">{selectedSections.length}</span>
            <span className="ml-1">section{selectedSections.length !== 1 ? 's' : ''} selected</span>
            {selectedSections.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">{format.toUpperCase()}</span>
                <span className="ml-1">format</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedSections.length === 0}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
