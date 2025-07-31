'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';

interface InventoryExportProps {
  filters: {
    glClass?: string;
    search?: string;
    status?: string;
    businessUnit?: string;
  };
  selectedItems?: string[];
  totalItems?: number;
  onExport?: () => void;
}

export function InventoryExport({ filters, selectedItems = [], totalItems = 0, onExport }: InventoryExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [exportType, setExportType] = useState<'filtered' | 'selected'>(
    selectedItems.length > 0 ? 'selected' : 'filtered'
  );

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        format,
        includeHeaders,
        filters: exportType === 'filtered' ? filters : {},
        selectedItems: exportType === 'selected' ? selectedItems : []
      };

      const response = await fetch('/api/jde/inventory/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
                   `inventory_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
      onExport?.();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportSummary = () => {
    if (exportType === 'selected') {
      return `${selectedItems.length} selected item${selectedItems.length !== 1 ? 's' : ''}`;
    } else {
      return `${totalItems} filtered item${totalItems !== 1 ? 's' : ''}`;
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Export Inventory Data</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Export Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Export Type</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="filtered"
                      checked={exportType === 'filtered'}
                      onChange={(e) => setExportType(e.target.value as 'filtered' | 'selected')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">
                      Current Filter ({totalItems} items)
                    </span>
                  </label>
                  {selectedItems.length > 0 && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="selected"
                        checked={exportType === 'selected'}
                        onChange={(e) => setExportType(e.target.value as 'filtered' | 'selected')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">
                        Selected Items ({selectedItems.length} items)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Export Format</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="csv"
                      checked={format === 'csv'}
                      onChange={(e) => setFormat(e.target.value as 'csv' | 'excel')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      CSV (.csv)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="excel"
                      checked={format === 'excel'}
                      onChange={(e) => setFormat(e.target.value as 'csv' | 'excel')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel (.xlsx)
                    </span>
                  </label>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Options</Label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">
                    Include column headers
                  </span>
                </label>
              </div>

              {/* Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Summary:</strong> Exporting {getExportSummary()} as {format.toUpperCase()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport} disabled={isExporting}>
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 