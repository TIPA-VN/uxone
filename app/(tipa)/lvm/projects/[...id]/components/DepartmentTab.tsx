"use client";
import { useState, useRef, useEffect } from "react";
import { Check, Upload, Trash2, Menu, Eye, Download, RotateCcw, Shield } from "lucide-react";
import { PDFTools } from "@/components/PDFTools";
import { SimpleDocumentViewer } from "@/components/SimpleDocumentViewer";
import { Document, DOCUMENT_TYPES } from "../types/project";
import { isRestrictedDocumentType } from "@/lib/documentAccess";
import { canUploadToDepartment, canApproveDepartment } from "@/lib/rbac";

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
    approvalState?: Record<string, any>;
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
  const [uploadResult, setUploadResult] = useState<any>(null);
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

  // Enhanced permission checks using RBAC functions
  const canUpload = user && canUploadToDepartment(
    user.role || '',
    user.department || '',
    department,
    user.id,
    project?.ownerId || ''
  );

  const canApprove = user && canApproveDepartment(
    user.role || '',
    user.department || '',
    department,
    user.id,
    project?.ownerId || ''
  );

  // Check if this department has already been approved
  const getDepartmentApprovalStatus = () => {
    if (!project?.approvalState || typeof project.approvalState !== 'object') {
      return { status: 'PENDING', canApprove: true, canReject: true };
    }

    const approvalState = project.approvalState as Record<string, any>;
    const deptApprovals = approvalState[department];
    
    if (!deptApprovals) {
      return { status: 'PENDING', canApprove: true, canReject: true };
    }

    // Handle both old format (string) and new format (array of logs)
    if (Array.isArray(deptApprovals)) {
      if (deptApprovals.length === 0) {
        return { status: 'PENDING', canApprove: true, canReject: true };
      }
      
      const latestApproval = deptApprovals[deptApprovals.length - 1];
      const status = latestApproval.status;
      
      if (status === 'APPROVED') {
        return { 
          status: 'APPROVED', 
          canApprove: false, 
          canReject: true,
          approvedBy: latestApproval.user,
          approvedAt: latestApproval.timestamp
        };
      } else if (status === 'REJECTED') {
        return { 
          status: 'REJECTED', 
          canApprove: true, 
          canReject: true,
          rejectedBy: latestApproval.user,
          rejectedAt: latestApproval.timestamp
        };
      }
    } else {
      // Handle old string format
      const status = deptApprovals;
      if (status === 'APPROVED') {
        return { status: 'APPROVED', canApprove: false, canReject: true };
      } else if (status === 'REJECTED') {
        return { status: 'REJECTED', canApprove: true, canReject: true };
      }
    }

    return { status: 'PENDING', canApprove: true, canReject: true };
  };

  const approvalStatus = getDepartmentApprovalStatus();


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
        const result = await res.json();
        setUploadResult(result);
        
        // Show appropriate message based on version decision
        if (result.versionDecision?.shouldCreateVersion === false) {
          setUploadStatus(`File uploaded successfully! File is identical to existing version ${result.versionDecision.version} - no new version created.`);
        } else {
          setUploadStatus(`Upload successful! New version ${result.versionDecision?.version || result.version} created.`);
        }
        
        setFile(null);
        setMeta({ type: "general", description: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setCurrentDocPage(1);
        onDocumentAction();
      } else {
        setUploadStatus("Upload failed.");
        setUploadResult(null);
      }
    } catch {
      setUploadStatus("Upload failed.");
      setUploadResult(null);
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
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
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
            <div className={`rounded-lg p-3 border ${
              approvalStatus.status === 'APPROVED' 
                ? 'bg-green-50 border-green-200' 
                : approvalStatus.status === 'REJECTED'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={`text-sm font-medium ${
                    approvalStatus.status === 'APPROVED' 
                      ? 'text-green-800' 
                      : approvalStatus.status === 'REJECTED'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }`}>
                    {approvalStatus.status === 'APPROVED' 
                      ? 'Department Approved' 
                      : approvalStatus.status === 'REJECTED'
                      ? 'Department Rejected'
                      : 'Department Approval Required'
                    }
                  </h3>
                  <p className={`text-xs mt-1 ${
                    approvalStatus.status === 'APPROVED' 
                      ? 'text-green-700' 
                      : approvalStatus.status === 'REJECTED'
                      ? 'text-red-700'
                      : 'text-yellow-700'
                  }`}>
                    {approvalStatus.status === 'APPROVED' 
                      ? `Approved by ${approvalStatus.approvedBy} on ${new Date(approvalStatus.approvedAt).toLocaleDateString()}`
                      : approvalStatus.status === 'REJECTED'
                      ? `Rejected by ${approvalStatus.rejectedBy} on ${new Date(approvalStatus.rejectedAt).toLocaleDateString()}`
                      : user?.role?.toUpperCase() === "ADMIN" 
                        ? `As an Admin, you can approve or reject this project for the ${department} department.`
                        : project.ownerId === user?.id
                        ? `As the project owner, you can approve or reject this project for the ${department} department.`
                        : `As a Senior Manager of ${department}, you can approve or reject this project.`
                    }
                  </p>
                </div>
              </div>
              
              {/* Approval Status Display */}
              {approvalStatus.status === 'APPROVED' && (
                <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded">
                  <div className="flex items-center text-green-800">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                </div>
              )}
              
              {approvalStatus.status === 'REJECTED' && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded">
                                      <div className="flex items-center text-red-800">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Rejected</span>
                    </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onApproval("approved")}
                  disabled={!approvalStatus.canApprove}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                    approvalStatus.canApprove
                      ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 cursor-pointer'
                      : 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                  }`}
                  title={approvalStatus.canApprove ? 'Approve Project' : 'Already Approved'}
                >
                  {approvalStatus.status === 'APPROVED' ? 'Approved' : 'Approve'}
                </button>
                <button
                  onClick={() => onApproval("disapproved")}
                  disabled={!approvalStatus.canReject}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                    approvalStatus.canReject
                      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 cursor-pointer'
                      : 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                  }`}
                  title={approvalStatus.canReject ? 'Reject Project' : 'Cannot Reject'}
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
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <p className="font-medium mb-1">ℹ️ Smart Versioning:</p>
            <p>The system automatically compares uploaded files with existing versions. Identical files won't create duplicate versions.</p>
          </div>
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

            {/* Version Decision Details */}
            {uploadResult && uploadResult.versionDecision && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                <h4 className="font-medium text-blue-800 mb-2">Version Decision Details:</h4>
                <div className="space-y-1 text-blue-700">
                  <div className="flex justify-between">
                    <span>Should Create Version:</span>
                    <span className={`font-medium ${
                      uploadResult.versionDecision.shouldCreateVersion ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {uploadResult.versionDecision.shouldCreateVersion ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version Number:</span>
                    <span className="font-medium">{uploadResult.versionDecision.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reason:</span>
                    <span className="font-medium">{uploadResult.versionDecision.reason}</span>
                  </div>
                  {uploadResult.versionDecision.similarity !== undefined && (
                    <div className="flex justify-between">
                      <span>Similarity:</span>
                      <span className="font-medium">
                        {Math.round(uploadResult.versionDecision.similarity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
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
                  setUploadResult(null);
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
                    <th className="py-2 px-3 text-left font-medium text-xs w-1/5">Version</th>
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
                      const documentType = (doc.metadata as { type?: string })?.type || '';
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
                            {DOCUMENT_TYPES.find(t => t.value === (doc.metadata as { type?: string })?.type)?.label || 'General'}
                          </span>
                        </td>
                        <td className="py-0.5 px-3 w-1/5">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            v{doc.version || 1}
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