"use client";
import { useState, useRef } from "react";
import { Check, Upload, Trash2, Menu, Eye, Download, RotateCcw } from "lucide-react";
import { PDFTools } from "@/components/PDFTools";
import { Document } from "../types/project";

interface DepartmentTabProps {
  projectId: string;
  department: string;
  docs: Document[];
  user: any;
  project: any;
  onDocumentAction: () => void;
}

export function DepartmentTab({ 
  projectId, 
  department, 
  docs, 
  user, 
  project, 
  onDocumentAction 
}: DepartmentTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ type: "", description: "" });
  const [docActionStatus, setDocActionStatus] = useState<Record<string, string | null>>({});
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [currentDocPage, setCurrentDocPage] = useState(1);
  const docsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload permission check
  const canUpload = user && (user.role?.toUpperCase() === "ADMIN" || 
    user.role?.toUpperCase() === "SENIOR MANAGER" || 
    user.role?.toUpperCase() === "MANAGER" || 
    project?.ownerId === user?.id);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
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
        setMeta({ type: "", description: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setCurrentDocPage(1);
        onDocumentAction();
      } else {
        setUploadStatus("Upload failed.");
      }
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Delete failed" }));
    }
  };

  const handleViewDoc = (doc: Document) => {
    // This will be handled by the parent component
    window.open(`/api/documents/${doc.id}/view`, '_blank');
  };

  const handleDownloadDoc = (doc: Document) => {
    window.open(`/api/documents/${doc.id}/download`, '_blank');
  };

  const toggleDropdown = (docId: string) => {
    setDropdownOpen(dropdownOpen === docId ? null : docId);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Left: Approval panel and PDF tools stacked vertically */}
      <div className="md:w-1/3 w-full flex flex-col gap-4">
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Upload Document</h3>
          <div className="w-1/4">
            <select
              value={meta.type}
              onChange={e => setMeta(m => ({ ...m, type: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-xs"
            >
              <option value="">Select Type</option>
              <option value="request">Request</option>
              <option value="design">Design</option>
              <option value="routing">Routing</option>
              <option value="testing">Testing</option>
              <option value="purchasing">Purchasing</option>
              <option value="quote">Quote</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="completed">Completed</option>
              <option value="released">Released</option>
            </select>
          </div>
        </div>
        {canUpload && (
          <form onSubmit={handleUpload} className="flex flex-col gap-3 mb-2">
            <label className="flex flex-col gap-1">
              <span className="font-medium text-xs">File</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                className="border rounded px-2 py-1 text-xs"
              />
            </label>
            <div className="flex gap-3">
              <div className="w-3/4">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-xs">Description</span>
                  <textarea
                    placeholder="Enter document description..."
                    value={meta.description}
                    onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                    className="border rounded px-2 py-1 text-xs resize-none w-full"
                    rows={6}
                  />
                </label>
              </div>
              <div className="w-1/4 flex flex-col gap-2 justify-center">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-2/3 mx-auto bg-green-600 text-white px-2 py-1.5 rounded hover:bg-green-700 text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setMeta({ type: "", description: "" });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="w-2/3 mx-auto bg-orange-500 text-white px-2 py-1.5 rounded hover:bg-orange-600 text-xs font-medium flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>
            {uploadStatus && <div className="text-xs text-center mt-2">{uploadStatus}</div>}
          </form>
        )}
        <div className="bg-gray-100 rounded p-1 overflow-x-auto">
          {docs.length === 0 ? (
            <div className="text-gray-400 text-xs">No documents for this department.</div>
          ) : (
            <>
              <table className="w-full text-xs min-w-[400px]">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <th className="py-2 px-3 text-left font-medium text-xs w-3/5">File Name</th>
                    <th className="py-2 px-3 text-left font-medium text-xs w-1/5">Uploaded At</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-1/5">Actions</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-1/5">Option</th>
                  </tr>
                </thead>
                <tbody>
                  {docs
                    .slice((currentDocPage - 1) * docsPerPage, currentDocPage * docsPerPage)
                    .map((doc, index) => {
                      const isApproved = (doc.metadata as any)?.approved === true;
                      const isProduction = doc.workflowState === "production";
                      const isSeniorManagerOfDept = user?.role?.toUpperCase() === "SENIOR MANAGER" &&
                        (user.department?.toUpperCase() === department?.toUpperCase() || 
                         user.department?.toLowerCase() === department?.toLowerCase());
                      const canApproveDoc = (user?.role?.toUpperCase() === "ADMIN" || isSeniorManagerOfDept || project?.ownerId === user?.id) && !isApproved && !isProduction;
                      const canSendToProduction = (user?.role?.toUpperCase() === "ADMIN" || isSeniorManagerOfDept || project?.ownerId === user?.id) && isApproved && !isProduction;
                      const isProjectOwner = project?.ownerId === user?.id;
                      const canDeleteDoc = isProjectOwner && !isProduction;
                      
                      return (
                      <tr key={doc.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-0.5 px-3 break-words w-3/5">{doc.fileName}</td>
                        <td className="py-0.5 px-3 w-1/5">{new Date(doc.createdAt).toLocaleString()}</td>
                        <td className="py-0.5 px-3 w-1/5">
                          <div className="flex justify-center gap-2">
                            {/* Approve Icon */}
                            <button
                              onClick={() => handleApproveDoc(doc.id)}
                              disabled={docActionStatus[doc.id] === "Approving..." || (doc.metadata as any)?.approved === true || doc.workflowState === "production"}
                              className={`p-1.5 rounded transition-colors ${
                                (doc.metadata as any)?.approved === true
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
                              disabled={docActionStatus[doc.id] === "Sending to production..." || doc.workflowState === "production" || !(doc.metadata as any)?.approved}
                              className={`p-1.5 rounded transition-colors ${
                                doc.workflowState === "production"
                                  ? "bg-green-100 text-green-600 cursor-not-allowed"
                                  : (doc.metadata as any)?.approved && canSendToProduction
                                  ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              } disabled:opacity-50`}
                              title={canSendToProduction && (doc.metadata as any)?.approved ? "Send to Production" : "Production not available"}
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
                          <div className="relative dropdown-container flex justify-center">
                            <button
                              onClick={() => toggleDropdown(doc.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Menu className="w-4 h-4 text-gray-600" />
                            </button>
                            {dropdownOpen === doc.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      )})}
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
  );
} 