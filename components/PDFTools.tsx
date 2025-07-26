import React, { useState, useCallback, useEffect } from 'react';

interface PDFToolsProps {
  projectId: string;
  department: string;
  onDocumentsUpdated?: () => void;
}

interface PageDocument {
  id: string;
  fileName: string;
  filePath: string;
  pageNumber?: number;
  size: number;
  metadata?: any;
  fileType: string;
}

export const PDFTools: React.FC<PDFToolsProps> = ({ 
  projectId, 
  department, 
  onDocumentsUpdated 
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'combine'>('split');
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitResult, setSplitResult] = useState<any>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  
  const [availablePages, setAvailablePages] = useState<PageDocument[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [combineLoading, setCombineLoading] = useState(false);
  const [combineResult, setCombineResult] = useState<any>(null);
  const [combineError, setCombineError] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;

  // Load available pages for combining
  const loadAvailablePages = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents?projectId=${projectId}&department=${department}&workflowState=draft`);
      if (response.ok) {
        const documents = await response.json();
        // Show all PDF files in the project for this department
        const pdfFiles = documents.filter((doc: any) => doc.fileType === 'pdf');
        setAvailablePages(pdfFiles);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  }, [projectId, department]);

  // Handle PDF splitting
  const handleSplitPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitFile) return;

    setSplitLoading(true);
    setSplitError(null);
    setSplitResult(null);

    try {
      const formData = new FormData();
      formData.append('file', splitFile);
      formData.append('projectId', projectId);
      formData.append('department', department);
      formData.append('metadata', JSON.stringify({ type: 'split-pdf' }));

      const response = await fetch('/api/documents/split-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSplitResult(result);
        setSplitFile(null);
        if (onDocumentsUpdated) {
          onDocumentsUpdated();
        }
      } else {
        setSplitError(result.error || 'Failed to split PDF');
      }
    } catch (error) {
      setSplitError('Network error occurred');
    } finally {
      setSplitLoading(false);
    }
  };

  // Handle PDF combining
  const handleCombinePages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPages.length === 0) return;

    setCombineLoading(true);
    setCombineError(null);
    setCombineResult(null);

    try {
      const response = await fetch('/api/documents/combine-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageIds: selectedPages,
          projectId,
          department,
          outputFileName: outputFileName || `combined_${Date.now()}`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setCombineResult(result);
        setSelectedPages([]);
        setOutputFileName('');
        if (onDocumentsUpdated) {
          onDocumentsUpdated();
        }
      } else {
        setCombineError(result.error || 'Failed to combine pages');
      }
    } catch (error) {
      setCombineError('Network error occurred');
    } finally {
      setCombineLoading(false);
    }
  };

  // Toggle page selection
  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // Select all pages
  const selectAllPages = () => {
    setSelectedPages(availablePages.map(page => page.id));
  };

  // Clear page selection
  const clearSelection = () => {
    setSelectedPages([]);
  };

  // Pagination logic
  const totalPages = Math.ceil(availablePages.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const currentFiles = availablePages.slice(startIndex, endIndex);

  // Reset to first page when files change
  useEffect(() => {
    setCurrentPage(1);
  }, [availablePages.length]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">PDF Tools</h3>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('split')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'split' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Split PDF
        </button>
        <button
          onClick={() => {
            setActiveTab('combine');
            loadAvailablePages();
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'combine' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Combine Pages
        </button>
      </div>

      {/* Split PDF Tab */}
      {activeTab === 'split' && (
        <div>
          <form onSubmit={handleSplitPDF} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select PDF to Split
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSplitFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={!splitFile || splitLoading}
              className="w-full bg-blue-600 text-white py-1 px-3 text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {splitLoading ? 'Splitting PDF...' : 'Split PDF'}
            </button>
          </form>

          {splitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {splitError}
            </div>
          )}

          {splitResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800 mb-2">PDF Split Successfully!</h4>
              <p className="text-sm text-green-700">
                Original file: {splitResult.originalFile}
              </p>
              <p className="text-sm text-green-700">
                Created {splitResult.totalPages} individual pages
              </p>
            </div>
          )}
        </div>
      )}

      {/* Combine Pages Tab */}
      {activeTab === 'combine' && (
        <div>
          <div className="mb-4">
            <button
              onClick={loadAvailablePages}
              className="bg-gray-600 text-white py-1 px-2 text-xs rounded hover:bg-gray-700 mr-2"
            >
              Refresh Pages
            </button>
            <button
              onClick={selectAllPages}
              className="bg-green-600 text-white py-1 px-2 text-xs rounded hover:bg-green-700 mr-2"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="bg-red-600 text-white py-1 px-2 text-xs rounded hover:bg-red-700 text-xs"
            >
              Clear Selection
            </button>
          </div>

          {availablePages.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No PDF files available for this project and department.
            </div>
          ) : (
            <>
              <div className="mb-4 border rounded">
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="space-y-2">
                    {currentFiles.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={() => togglePageSelection(page.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                                              <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {page.fileName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {page.metadata?.pageNumber ? `Page ${page.metadata.pageNumber}` : 'Full document'} • {(page.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, availablePages.length)} of {availablePages.length} files
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleCombinePages} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Output File Name (optional)
                  </label>
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    placeholder="combined_document"
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={selectedPages.length === 0 || combineLoading}
                  className="w-full bg-blue-600 text-white py-1 px-3 text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {combineLoading ? 'Combining Pages...' : `Combine ${selectedPages.length} Selected Pages`}
                </button>
              </form>

              {combineError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  {combineError}
                </div>
              )}

              {combineResult && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-green-800 mb-2">Pages Combined Successfully!</h4>
                  <p className="text-sm text-green-700">
                    Created: {combineResult.fileName}
                  </p>
                  <p className="text-sm text-green-700">
                    Combined {selectedPages.length} pages
                  </p>
                  <p className="text-sm text-green-700">
                    Source files have been deleted
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}; 