import { useState, useEffect, useRef } from 'react';
import { Document, DocumentMetadata } from '../types/project';

export function useDocuments(projectId: string, department?: string) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [productionDocs, setProductionDocs] = useState<Document[]>([]);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<DocumentMetadata>({ type: "", description: "" });
  const [docActionStatus, setDocActionStatus] = useState<Record<string, string | null>>({});
  const [currentDocPage, setCurrentDocPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/documents?projectId=${projectId}&department=${department || ''}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchAllDocuments = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/documents?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setAllDocs(data);
      }
    } catch (error) {
      console.error("Error fetching all documents:", error);
    }
  };

  const fetchProductionDocuments = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/documents?projectId=${projectId}&workflowState=production`);
      if (res.ok) {
        const data = await res.json();
        setProductionDocs(data);
      }
    } catch (error) {
      console.error("Error fetching production documents:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchAllDocuments();
    fetchProductionDocuments();
  }, [projectId, department]);

  const uploadDocument = async () => {
    if (!file || !projectId) return;
    
    // Check for name duplication
    const existingDoc = allDocs.find(doc => doc.fileName === file.name);
    if (existingDoc) {
      setUploadStatus("File with this name already exists. Please rename the file or choose a different one.");
      return;
    }
    
    setUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(meta));
    formData.append("department", department || '');
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
        fetchDocuments();
        fetchAllDocuments();
      } else {
        setUploadStatus("Upload failed.");
      }
    } catch (error) {
      setUploadStatus("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const approveDocument = async (docId: string) => {
    setDocActionStatus(prev => ({ ...prev, [docId]: "Approving..." }));
    try {
      const res = await fetch(`/api/documents/${docId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setDocActionStatus(prev => ({ ...prev, [docId]: null }));
        fetchDocuments();
      } else {
        setDocActionStatus(prev => ({ ...prev, [docId]: "Approval failed" }));
      }
    } catch (error) {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Approval failed" }));
    }
  };

  const sendToProduction = async (docId: string) => {
    setDocActionStatus(prev => ({ ...prev, [docId]: "Sending to production..." }));
    try {
      const res = await fetch(`/api/documents/${docId}/production`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setDocActionStatus(prev => ({ ...prev, [docId]: null }));
        fetchDocuments();
        fetchProductionDocuments();
      } else {
        setDocActionStatus(prev => ({ ...prev, [docId]: "Failed to send to production" }));
      }
    } catch (error) {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Failed to send to production" }));
    }
  };

  const deleteDocument = async (docId: string) => {
    setDocActionStatus(prev => ({ ...prev, [docId]: "Deleting..." }));
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocActionStatus(prev => ({ ...prev, [docId]: null }));
        fetchDocuments();
        fetchAllDocuments();
        fetchProductionDocuments();
      } else {
        setDocActionStatus(prev => ({ ...prev, [docId]: "Deletion failed" }));
      }
    } catch (error) {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Deletion failed" }));
    }
  };

  return {
    docs,
    productionDocs,
    allDocs,
    uploading,
    uploadStatus,
    file,
    setFile,
    meta,
    setMeta,
    docActionStatus,
    currentDocPage,
    setCurrentDocPage,
    fileInputRef,
    uploadDocument,
    approveDocument,
    sendToProduction,
    deleteDocument,
    fetchDocuments,
    fetchAllDocuments,
    fetchProductionDocuments,
  };
} 