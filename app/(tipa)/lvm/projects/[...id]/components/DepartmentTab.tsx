"use client";
import { useState, useRef, useEffect } from "react";
import { Check, Upload, Trash2, Menu, Eye, Download, RotateCcw, Shield } from "lucide-react";
import { PDFTools } from "@/components/PDFTools";
import { SimpleDocumentViewer } from "@/components/SimpleDocumentViewer";
import { Document, DOCUMENT_TYPES } from "../types/project";
import { isRestrictedDocumentType } from "@/lib/documentAccess";

interface DepartmentTabProps {
  projectId: string;
  department: string;
  docs: Document[];
  user: {
    id: string;
    role?: string;
    department?: string;
  } | undefined;
  project: {
    ownerId?: string;
    approvalState?: Record<string, string>;
  };
  onDocumentAction: () => void;
  onApproval: (action: "approved" | "disapproved") => void;
  actionStatus: string | null;
}

export function DepartmentTab({ 
  projectId, 
  department, 
  docs, 
  user, 
  project, 
  onDocumentAction,
  onApproval,
  actionStatus
}: DepartmentTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ type: "general", description: "" });
  const [docActionStatus, setDocActionStatus] = useState<Record<string, string | null>>({});
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [currentDocPage, setCurrentDocPage] = useState(1);
  const docsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    fileName: string;
    filePath: string;
    documentId: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Upload permission check
  const canUpload = user && (user.role?.toUpperCase() === "ADMIN" || 
    user.role?.toUpperCase() === "SENIOR MANAGER" || 
    user.role?.toUpperCase() === "SENIOR_MANAGER" ||
    user.role?.toUpperCase() === "MANAGER" || 
    project?.ownerId === user?.id);

  // Approval permission check
  const approvalState = project?.approvalState || {};
  const isSeniorManagerOfDept =
    user &&
    (user.role?.toUpperCase() === "SENIOR MANAGER" || user.role?.toUpperCase() === "SENIOR_MANAGER") &&
    (user.department?.toUpperCase() === department?.toUpperCase() || 
     user.department?.toLowerCase() === department?.toLowerCase());
  const canApprove =
    user &&
    project &&
    (user.role?.toUpperCase() === "ADMIN" || 
     isSeniorManagerOfDept || 
     project.ownerId === user.id) &&
    approvalState[department] !== "APPROVED" &&
    approvalState[department] !== "REJECTED";

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus("Please select a file to upload.");
      return;
    }
    
    if (!meta.type) {
      setUploadStatus("Please select a document type before uploading.");
      return;
    }
    
    setUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(meta));
    formData.append("department", department);
    formData.append("projectId", projectId);
    
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        setUploadStatus("Upload successful!");
        setFile(null);
        setMeta({ type: "general", description: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setCurrentDocPage(1);
        onDocumentAction();
      } else {
        setUploadStatus("Upload failed.");
      }
    } catch {
      setUploadStatus("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleApproveDoc = async (docId: string) => {
    setDocActionStatus(prev => ({ ...prev, [docId]: "Approving..." }));
    try {
      const res = await fetch(`/api/documents/${docId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setDocActionStatus(prev => ({ ...prev, [docId]: null }));
        onDocumentAction();
      } else {
        setDocActionStatus(prev => ({ ...prev, [docId]: "Approval failed" }));
      }
    } catch {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Approval failed" }));
    }
  };

  const handleSendToProduction = async (docId: string) => {
    setDocActionStatus(prev => ({ ...prev, [docId]: "Sending to production..." }));
    try {
      const res = await fetch(`/api/documents/${docId}/production`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setDocActionStatus(prev => ({ ...prev, [docId]: null }));
        onDocumentAction();
      } else {
        setDocActionStatus(prev => ({ ...prev, [docId]: "Failed to send to production" }));
      }
    } catch {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Failed to send to production" }));
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    
    setDocActionStatus(prev => ({ ...prev, [docId]: "Deleting..." }));
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocActionStatus(prev => ({ ...prev, [docId]: null }));
        onDocumentAction();
      } else {
        const errorData = await res.json();
        setDocActionStatus(prev => ({ ...prev, [docId]: errorData.error || "Delete failed" }));
      }
    } catch {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Delete failed" }));
    }
  };

  const handleViewDoc = (doc: Document) => {
    // Create a document object with the correct filePath URL for viewing
    const documentForViewing = {
      fileName: doc.fileName,
      filePath: `/api/documents/${doc.id}/view`,
      documentId: doc.id
    };
    setSelectedDocument(documentForViewing);
    setViewerOpen(true);
    setDropdownOpen(null); // Close dropdown when opening viewer
  };

  const handleDownloadDoc = (doc: Document) => {
    window.open(`/api/documents/${doc.id}/download`, '_blank');
    setDropdownOpen(null); // Close dropdown after download action
  };

  const toggleDropdown = (docId: string) => {
    setDropdownOpen(dropdownOpen === docId ? null : docId);
  };

  // Close dropdown when clicking outside
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

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
      {/* Left: Approval panel and PDF tools stacked vertically */}
      <div className="md:w-1/3 w-full flex flex-col gap-4">
        {/* Approval Section */}
        {canApprove && (
          <div className="bg-white rounded-lg shadow p-4 border border-yellow-200">
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Department Approval Required
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    {user?.role?.toUpperCase() === "ADMIN" 
                      ? `As an Admin, you can approve or reject this project for the ${department} department.`
                      : project.ownerId === user?.id
                      ? `As the project owner, you can approve or reject this project for the ${department} department.`
                      : `As a Senior Manager of ${department}, you can approve or reject this project.`
                    }
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onApproval("approved")}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => onApproval("disapproved")}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
            {/* Action Status */}
            {actionStatus && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">{actionStatus}</p>
              </div>
            )}
          </div>
        )}

        {/* PDF Tools Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <PDFTools 
            projectId={projectId} 
            department={department} 
            onDocumentsUpdated={onDocumentAction}
          />
        </div>
      </div>
      
      {/* Right: Document upload form and list */}
      <div className="md:w-2/3 w-full bg-white rounded-lg shadow p-3 text-sm">
        <div className="mb-3">
          <h3 className="font-semibold mb-2">Upload Document</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Document Type Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={meta.type}
                onChange={e => setMeta(m => ({ ...m, type: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {DOCUMENT_TYPES.map((docType) => (
                  <option key={docType.value} value={docType.value}>
                    {docType.label}
                  </option>
                ))}
              </select>
              {meta.type && (
                <p className="text-xs text-gray-500 mt-1">
                  {DOCUMENT_TYPES.find(t => t.value === meta.type)?.description}
                </p>
              )}
            </div>
            
            {/* File Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {file && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
        </div>
        {canUpload && (
          <form onSubmit={handleUpload} className="space-y-3 mb-4">
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Enter document description (optional)..."
                value={meta.description}
                onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Upload Status */}
            {uploadStatus && (
              <div className={`text-xs p-2 rounded ${
                uploadStatus.includes('successful') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : uploadStatus.includes('failed') || uploadStatus.includes('Please')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {uploadStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading || !file || !meta.type}
                className="w-1/4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setMeta({ type: "general", description: "" });
                  setUploadStatus(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-1/4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
            </div>
          </form>
        )}
        <div className="bg-gray-100 rounded p-1 overflow-x-auto">
          {docs.length === 0 ? (
            <div className="text-gray-400 text-xs">No documents for this department.</div>
          ) : (
            <>
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <th className="py-2 px-3 text-left font-medium text-xs w-2/5">File Name</th>
                    <th className="py-2 px-3 text-left font-medium text-xs w-1/5">Type</th>
                    <th className="py-2 px-3 text-left font-medium text-xs w-1/5">Uploaded At</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-1/5">Actions</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-1/5">Option</th>
                  </tr>
                </thead>
                <tbody>
                  {docs
                    .slice((currentDocPage - 1) * docsPerPage, currentDocPage * docsPerPage)
                    .map((doc, index) => {
                      const isApproved = (doc.metadata as { approved?: boolean })?.approved === true;
                      const isProduction = doc.workflowState === "production";
                      const isSeniorManagerOfDept = (user?.role?.toUpperCase() === "SENIOR MANAGER" || user?.role?.toUpperCase() === "SENIOR_MANAGER") &&
                        (user.department?.toUpperCase() === department?.toUpperCase() || 
                         user.department?.toLowerCase() === department?.toLowerCase());
                      const canApproveDoc = (user?.role?.toUpperCase() === "ADMIN" || isSeniorManagerOfDept || project?.ownerId === user?.id) && !isApproved && !isProduction;
                      const canSendToProduction = (user?.role?.toUpperCase() === "ADMIN" || isSeniorManagerOfDept || project?.ownerId === user?.id) && isApproved && !isProduction;
                      const isProjectOwner = project?.ownerId === user?.id;
                      const canDeleteDoc = isProjectOwner && !isProduction;
                      
                      // Check if user can access this document type
                      const documentType = (doc.metadata as any)?.type as string;
                      const isRestricted = isRestrictedDocumentType(documentType);
                      const userRole = user?.role?.toUpperCase();
                      const isAdmin = userRole === "ADMIN";
                      const isSeniorManager = userRole === "SENIOR MANAGER" || userRole === "SENIOR_MANAGER";
                      const canAccessRestricted = isAdmin || isSeniorManager || isProjectOwner;
                      const canViewDownload = !isRestricted || canAccessRestricted;
                      
                      return (
                      <tr key={doc.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-0.5 px-3 break-words w-2/5">
                          <div className="flex items-center gap-2">
                            {isRestricted && (
                              <Shield className="w-3 h-3 text-orange-500" />
                            )}
                            {doc.fileName}
                          </div>
                        </td>
                        <td className="py-0.5 px-3 w-1/5">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {DOCUMENT_TYPES.find(t => t.value === (doc.metadata as any)?.type)?.label || 'General'}
                          </span>
                        </td>
                        <td className="py-0.5 px-3 w-1/5">{new Date(doc.createdAt).toLocaleString()}</td>
                        <td className="py-0.5 px-3 w-1/5">
                          <div className="flex justify-center gap-2">
                            {/* Approve Icon */}
                            <button
                              onClick={() => handleApproveDoc(doc.id)}
                              disabled={docActionStatus[doc.id] === "Approving..." || (doc.metadata as { approved?: boolean })?.approved === true || doc.workflowState === "production"}
                                                              className={`p-1.5 rounded transition-colors ${
                                  (doc.metadata as { approved?: boolean })?.approved === true
                                    ? "bg-green-100 text-green-600 cursor-not-allowed"
                                    : canApproveDoc
                                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                } disabled:opacity-50`}
                              title={canApproveDoc ? "Approve Document" : "Approval not available"}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            
                            {/* Upload to Production Icon */}
                            <button
                              onClick={() => handleSendToProduction(doc.id)}
                              disabled={docActionStatus[doc.id] === "Sending to production..." || doc.workflowState === "production" || !(doc.metadata as { approved?: boolean })?.approved}
                                                              className={`p-1.5 rounded transition-colors ${
                                  doc.workflowState === "production"
                                    ? "bg-green-100 text-green-600 cursor-not-allowed"
                                    : (doc.metadata as { approved?: boolean })?.approved && canSendToProduction
                                    ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                } disabled:opacity-50`}
                              title={canSendToProduction && (doc.metadata as { approved?: boolean })?.approved ? "Send to Production" : "Production not available"}
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            
                            {/* Delete Icon */}
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              disabled={docActionStatus[doc.id] === "Deleting..." || !canDeleteDoc}
                              className={`p-1.5 rounded transition-colors ${
                                canDeleteDoc
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              } disabled:opacity-50`}
                              title={canDeleteDoc ? "Delete Document" : "Delete not available"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {docActionStatus[doc.id] && docActionStatus[doc.id] !== "Approving..." && docActionStatus[doc.id] !== "Sending to production..." && docActionStatus[doc.id] !== "Deleting..." && (
                            <div className="text-center mt-1">
                              <span className="text-[10px] text-red-600">{docActionStatus[doc.id]}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-0.5 px-3 w-1/5">
                          <div className="relative dropdown-container flex justify-center" ref={dropdownRef}>
                            <button
                              onClick={() => toggleDropdown(doc.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Menu className="w-4 h-4 text-gray-600" />
                            </button>
                            {dropdownOpen === doc.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                                {canViewDownload ? (
                                  <>
                                    <button
                                      onClick={() => handleViewDoc(doc)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleDownloadDoc(doc)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download
                                    </button>
                                  </>
                                ) : (
                                  <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Access Restricted
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {docs.length > docsPerPage && (
                <div className="border-t bg-gray-50 px-2 py-1 flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-600">
                    Showing {((currentDocPage - 1) * docsPerPage) + 1}-{Math.min(currentDocPage * docsPerPage, docs.length)} of {docs.length} documents
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentDocPage(prev => Math.max(1, prev - 1))}
                      disabled={currentDocPage === 1}
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 px-2">
                      Page {currentDocPage} of {Math.ceil(docs.length / docsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentDocPage(prev => Math.min(Math.ceil(docs.length / docsPerPage), prev + 1))}
                      disabled={currentDocPage === Math.ceil(docs.length / docsPerPage)}
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      </div>
      
      {/* Document Viewer Modal - Rendered outside main component */}
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
    </>
  );
} 