"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  User,
  Archive,
  GitBranch,
  Lock,
  Search,
  Filter,
  Shield
} from "lucide-react";
import { SimpleDocumentViewer } from "@/components/SimpleDocumentViewer";
import { Document } from "../types/project";
import { isRestrictedDocumentType } from "@/lib/documentAccess";

interface ProductionTabProps {
  projectId: string;
  productionDocs: Document[];
  user: {
    id: string;
    role?: string;
    department?: string;
  } | undefined;
  onRefresh: () => void;
}

export function ProductionTab({ projectId, productionDocs, user, onRefresh }: ProductionTabProps) {
  const [selectedDocument, setSelectedDocument] = useState<{
    fileName: string;
    filePath: string;
    documentId: string;
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter documents based on search and file type
  const filteredDocs = productionDocs.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFileType = selectedFileType === "all" || 
                           (doc.fileType && doc.fileType.includes(selectedFileType));
    return matchesSearch && matchesFileType;
  });

  // Group documents by filename to show versions
  const groupedDocuments = filteredDocs.reduce((groups, doc) => {
    const key = doc.fileName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);

  // Sort versions within each group (newest first)
  Object.keys(groupedDocuments).forEach(filename => {
    groupedDocuments[filename].sort((a, b) => (b.version || 1) - (a.version || 1));
  });

  // Click outside detection for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleViewDoc = (doc: Document) => {
    setSelectedDocument({
      fileName: doc.fileName,
      filePath: `/api/documents/${doc.id}/view`,
      documentId: doc.id
    });
    setViewerOpen(true);
    setDropdownOpen(null);
  };

  const handleDownloadDoc = (doc: Document) => {
    window.open(`/api/documents/${doc.id}/download`, '_blank');
    setDropdownOpen(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📁';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('gif')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document') || fileType.includes('docx') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xlsx') || fileType.includes('xls')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('pptx') || fileType.includes('ppt')) return '📊';
    if (fileType.includes('cad') || fileType.includes('dwg') || fileType.includes('dxf')) return '🏗️';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
    return '📁';
  };

  const getFileTypeName = (fileType?: string) => {
    if (!fileType) return 'Unknown';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('gif')) return 'Image';
    if (fileType.includes('word') || fileType.includes('document') || fileType.includes('docx') || fileType.includes('doc')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xlsx') || fileType.includes('xls')) return 'Excel';
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('pptx') || fileType.includes('ppt')) return 'PowerPoint';
    if (fileType.includes('cad') || fileType.includes('dwg') || fileType.includes('dxf')) return 'CAD';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return 'Archive';
    return fileType.toUpperCase();
  };

  const getFileTypeColor = (fileType?: string) => {
    if (!fileType) return 'bg-gray-50 text-gray-700 border-gray-200';
    if (fileType.includes('pdf')) return 'bg-red-50 text-red-700 border-red-200';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('gif')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (fileType.includes('word') || fileType.includes('document') || fileType.includes('docx') || fileType.includes('doc')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xlsx') || fileType.includes('xls')) return 'bg-green-50 text-green-700 border-green-200';
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('pptx') || fileType.includes('ppt')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (fileType.includes('cad') || fileType.includes('dwg') || fileType.includes('dxf')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Calculate file type statistics
  const fileTypeStats = productionDocs.reduce((stats, doc) => {
    const fileType = getFileTypeName(doc.fileType);
    stats[fileType] = (stats[fileType] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);

  // Helper function to check if user can access a document
  const canAccessDocument = (doc: Document) => {
    const documentType = (doc.metadata as any)?.type as string;
    const isRestricted = isRestrictedDocumentType(documentType);
    
    if (!isRestricted) return true;
    
    const userRole = user?.role?.toUpperCase();
    const isAdmin = userRole === "ADMIN";
    const isSeniorManager = userRole === "SENIOR MANAGER" || userRole === "SENIOR_MANAGER";
    
    return isAdmin || isSeniorManager;
  };

  return (
    <div className="space-y-4">
      {/* Combined Header Row - 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Production Documents Header */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                  <Archive className="w-4 h-4 text-emerald-600" />
                  Production Documents
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Read-only storage for production files with automatic versioning
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                <span>Protected</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Production Files Search */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <CardTitle className="text-base text-gray-800">Production Files</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  {filteredDocs.length} of {productionDocs.length} production document{productionDocs.length !== 1 ? 's' : ''} with versioning
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
              >
                Refresh
              </Button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search by filename or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-xs"
                />
              </div>

              {/* File Type Filter */}
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-gray-400" />
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-xs"
                >
                  <option value="all">All File Types</option>
                  <option value="pdf">PDF Documents</option>
                  <option value="image">Images</option>
                  <option value="word">Word Documents</option>
                  <option value="excel">Excel Files</option>
                  <option value="powerpoint">PowerPoint</option>
                  <option value="cad">CAD Files</option>
                  <option value="zip">Archives</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Document List - Table Format */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardContent className="p-4">
          {Object.keys(groupedDocuments).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Archive className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Production Documents</h3>
              <p className="text-gray-600 text-sm">
                Documents sent to production will appear here with version tracking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 bg-white">File</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 bg-white">Type</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 bg-white">Latest Version</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 bg-white">Department</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 bg-white">Date</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 bg-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedDocuments).map(([filename, versions], index) => (
                      <tr key={filename} className={`border-b border-gray-100 transition-colors ${
                        index % 2 === 0 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFileIcon(versions[0].fileType)}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-sm text-gray-900 truncate">{filename}</span>
                                {isRestrictedDocumentType((versions[0].metadata as any)?.type) && (
                                  <Shield className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {versions.length} version{versions.length !== 1 ? 's' : ''} • {versions[0].size ? formatFileSize(versions[0].size) : 'Unknown size'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className={`text-xs ${getFileTypeColor(versions[0].fileType)}`}>
                            {getFileTypeName(versions[0].fileType)}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-emerald-500" />
                            <span className="font-medium text-xs text-gray-700">v{versions[0].version}</span>
                            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 text-xs px-1 py-0">
                              Latest
                            </Badge>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-sm text-gray-700">{versions[0].department}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-sm text-gray-600">{new Date(versions[0].createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="relative" ref={dropdownRef}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDropdownOpen(dropdownOpen === versions[0].id ? null : versions[0].id)}
                              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              Actions
                              <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>
                            
                            {dropdownOpen === versions[0].id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <div className="py-1">
                                  {canAccessDocument(versions[0]) ? (
                                    <>
                                      <button
                                        onClick={() => handleViewDoc(versions[0])}
                                        className="flex items-center gap-1 w-full px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View
                                      </button>
                                      <button
                                        onClick={() => handleDownloadDoc(versions[0])}
                                        className="flex items-center gap-1 w-full px-2 py-1 text-xs text-green-700 hover:bg-green-50 transition-colors"
                                      >
                                        <Download className="w-3 h-3" />
                                        Download
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 w-full px-2 py-1 text-xs text-gray-500 bg-gray-50">
                                      <Eye className="w-3 h-3" />
                                      Restricted
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {viewerOpen && selectedDocument && (
        <SimpleDocumentViewer
          fileName={selectedDocument.fileName}
          filePath={selectedDocument.filePath}
          documentId={selectedDocument.documentId}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
} 