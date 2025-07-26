"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle, Clock, AlertCircle, Check, Factory, MoreVertical, Eye, Download, Menu, Upload, Trash2, RotateCcw, Calendar } from "lucide-react";
import { PDFTools } from "@/components/PDFTools";
import { DocumentViewer } from "@/components/DocumentViewer";
import { ProjectAnalytics } from "@/components/ProjectAnalytics";
import { DueDateEditor } from "@/components/DueDateEditor";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  departments: string[];
  approvalState?: Record<string, any>; // allow array/object for logs
  ownerId?: string;
  requestDate?: string;
  departmentDueDates?: Record<string, string>;
  // add other fields as needed
};

  type Document = {
    id: string;
    fileName: string;
    filePath: string;
    createdAt: string;
    version?: number;
    department?: string;
    workflowState?: string;
    metadata?: { 
      type?: string; 
      description?: string; 
      approved?: boolean;
      production?: boolean;
      pageNumber?: number;
      [key: string]: unknown 
    };
    // add other fields as needed
  };

const DEPARTMENTS = [
  { value: "logistics", label: "Logistics" },
  { value: "procurement", label: "Procurement" },
  { value: "pc", label: "Production Planning" },
  { value: "qa", label: "Quality Assurance" },
  { value: "qc", label: "Quality Control" },
  { value: "pm", label: "Production Maintenance" },
  { value: "fm", label: "Facility Management" },
  { value: "hra", label: "Human Resources" },
  { value: "cs", label: "Customer Service" },
  { value: "sales", label: "Sales" },
  { value: "LVM-EXPAT", label: "LVM EXPATS" },
];

const getStatusIcon = (status: string | undefined) => {
  switch(status) {
    case "APPROVED":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "REJECTED":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "PENDING":
      return <Clock className="w-5 h-5 text-orange-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
  }
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<Project | null>(null);
  // Add a MAIN tab
  const [activeTab, setActiveTab] = useState<string>("");
  const [userSelectedTab, setUserSelectedTab] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [productionDocs, setProductionDocs] = useState<Document[]>([]);
  const [allDocs, setAllDocs] = useState<Document[]>([]); // All documents for the project
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ type: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const user = session?.user;
  
  // Comment and updates state
  const [comments, setComments] = useState<Array<{
    id: string;
    text: string;
    author: string;
    authorId: string;
    timestamp: string;
    type: 'comment' | 'update';
  }>>([]);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<'comment' | 'update'>('comment');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Pagination state for document upload table
  const [currentDocPage, setCurrentDocPage] = useState(1);
  const docsPerPage = 10;
  
  // Document workflow state
  const [docActionStatus, setDocActionStatus] = useState<Record<string, string | null>>({});
  
  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Due dates editor state
  const [showDueDateEditor, setShowDueDateEditor] = useState(false);
  const [dueDateEditorDepartment, setDueDateEditorDepartment] = useState<string | null>(null);


  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/projects?id=${projectId}`)
      .then(res => res.json())
      .then(data => {
        let proj = Array.isArray(data)
          ? data.find((p: any) => String(p.id) === String(projectId))
          : data;
        setProject(proj);
        setLoading(false);
      });
  }, [projectId]);

  // Set activeDept to user's department after project loads, but preserve current tab if it's valid
  useEffect(() => {
    if (project && Array.isArray(project.departments) && project.departments.length > 0) {
      // Only set to user's department if current activeTab is not a valid department and user hasn't manually selected a tab
      const isValidCurrentTab = activeTab && project.departments.includes(activeTab);
      if (!isValidCurrentTab && !userSelectedTab) {
        // Try to set to user's department, fallback to first department if user's department not in project
        const userDepartment = user?.department?.toLowerCase();
        const projectDepartmentsLower = project.departments.map(dept => dept.toLowerCase());
        const userDeptInProject = userDepartment && projectDepartmentsLower.includes(userDepartment);
        
        // Find the original case version of the user's department in project
        const originalCaseUserDept = userDepartment ? 
          project.departments.find(dept => dept.toLowerCase() === userDepartment) : null;
        
        const newTab = userDeptInProject ? (originalCaseUserDept || userDepartment) : project.departments[0];
        setActiveTab(newTab);
      }
    } else {
      setActiveTab("");
    }
  }, [project, user?.department, userSelectedTab]);

  useEffect(() => {
    if (!projectId || !activeTab || activeTab === "MAIN") return;
    fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
      .then(res => res.json())
      .then(data => {
        // Sort documents by status priority: Production > Approved > Draft, then by last updated
        const sortedData = data.sort((a: Document, b: Document) => {
          // First, sort by status priority
          const getStatusPriority = (doc: Document) => {
            if (doc.workflowState === "production") return 3;
            if ((doc.metadata as any)?.approved === true) return 2;
            return 1; // draft
          };
          
          const aPriority = getStatusPriority(a);
          const bPriority = getStatusPriority(b);
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          // If same status, sort by last updated
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setDocs(sortedData);
        setCurrentDocPage(1); // Reset to first page when department changes
      });
  }, [projectId, activeTab, uploading]);

  // Fetch production documents
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/documents?projectId=${projectId}&workflowState=production`)
      .then(res => res.json())
      .then(data => {
        // Sort production documents by last updated (createdAt)
        const sortedData = data.sort((a: Document, b: Document) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setProductionDocs(sortedData);
      });
  }, [projectId, uploading]);

  // Fetch all documents for the project
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/documents?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        // Sort all documents by last updated (createdAt)
        const sortedData = data.sort((a: Document, b: Document) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllDocs(sortedData);
      });
  }, [projectId, uploading]);

  // Fetch comments for the project
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/comments?projectId=${projectId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Check if data is an array before sorting
        if (Array.isArray(data)) {
          // Sort comments by timestamp (newest first)
          const sortedComments = data.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setComments(sortedComments);
        } else {
          console.error('Invalid data format received:', data);
          setComments([]);
        }
      })
      .catch(error => {
        console.error('Error fetching comments:', error);
        // If API doesn't exist yet or other error, use empty array
        setComments([]);
      });
  }, [projectId]);

  // Always default approvalState to an object
  const approvalState = project?.approvalState || {};

  const isAdminOrSenior = ["ADMIN", "SENIOR MANAGER"].includes(user?.role?.toUpperCase() || "");
  // Only the senior manager of the department can approve
  const isSeniorManagerOfDept =
    user &&
    user.role?.toUpperCase() === "SENIOR MANAGER" &&
    user.department?.toUpperCase() === activeTab;
  const canApprove =
    user &&
    project &&
    isSeniorManagerOfDept &&
    approvalState[activeTab] !== "APPROVED" &&
    approvalState[activeTab] !== "REJECTED";

  const canUpload = user && project && (isAdminOrSenior || user.department === activeTab);

  const handleApproval = async (action: "approved" | "disapproved") => {
    setActionStatus(null);
    const res = await fetch(`/api/projects/${projectId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department: activeTab, action }),
    });
    if (res.ok) {
      setActionStatus("Action successful!");
      const updated = await res.json();
      setProject(updated);
    } else {
      setActionStatus("Action failed.");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
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
    formData.append("department", activeTab);
    formData.append("projectId", projectId);
    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      setUploadStatus("Upload successful!");
      setFile(null);
      setMeta({ type: "", description: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setCurrentDocPage(1); // Reset to first page after upload
      setUploading(false);
      fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
        .then(res => res.json())
        .then(data => setDocs(data));
    } else {
      setUploadStatus("Upload failed.");
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
        // Refresh documents
        fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
          .then(res => res.json())
          .then(data => setDocs(data));
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
        // Refresh documents
        fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
          .then(res => res.json())
          .then(data => setDocs(data));
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
        // Refresh documents
        fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
          .then(res => res.json())
          .then(data => setDocs(data));
      } else {
        const errorData = await res.json();
        setDocActionStatus(prev => ({ ...prev, [docId]: errorData.error || "Delete failed" }));
      }
    } catch (error) {
      setDocActionStatus(prev => ({ ...prev, [docId]: "Delete failed" }));
    }
  };

  const handleViewDoc = (doc: Document) => {
    setViewerDoc(doc);
    setViewerOpen(true);
    setDropdownOpen(null);
  };

  const handleDownloadDoc = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.filePath;
    link.target = '_blank';
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDropdownOpen(null);
  };

  const toggleDropdown = (docId: string) => {
    setDropdownOpen(dropdownOpen === docId ? null : docId);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerDoc(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setSubmittingComment(true);
    try {
      const commentData = {
        text: newComment.trim(),
        type: commentType,
        author: user.name || user.username || 'Unknown User',
        projectId: projectId,
      };
      
      const res = await fetch('/api/projects/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });
      
      if (res.ok) {
        const savedComment = await res.json();
        setComments(prev => [savedComment, ...prev]);
        setNewComment("");
        setCommentType('comment');
      } else {
        console.error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveDueDates = async (requestDate: string, departmentDueDates: Record<string, string>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/due-dates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestDate: requestDate || null,
          departmentDueDates
        }),
      });
      
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setShowDueDateEditor(false);
      } else {
        console.error('Failed to save due dates');
      }
    } catch (error) {
      console.error('Error saving due dates:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Focus modal when it opens
  useEffect(() => {
    if (viewerOpen) {
      const modalElement = document.querySelector('[tabindex="-1"]') as HTMLElement;
      if (modalElement) {
        modalElement.focus();
      }
    }
  }, [viewerOpen]);

  // Defensive fallback rendering for missing departments or approvalState
  if (project && (!Array.isArray(project.departments) || project.departments.length === 0)) {
    return <div className="p-8 text-red-600">No departments found for this project.</div>;
  }
  if (project && !project.approvalState) {
    return <div className="p-8 text-red-600">No approval state found for this project.</div>;
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8 text-red-600">Project not found.</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Status card removed from top */}

      <div className="flex flex-wrap gap-1 border-b mb-4" role="tablist" aria-label="Department Tabs">
        {(project.departments || []).map((dept: string) => {
          const isActive = activeTab === dept;
          const getTabColor = (dept: string, active: boolean) => {
            switch(dept) {
              case 'logistics': return active
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100';
              case 'procurement': return active
                ? 'bg-blue-500 text-white border-blue-600'
                : 'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100';
              case 'pc': return active
                ? 'bg-sky-500 text-white border-sky-600'
                : 'border-sky-500 text-sky-600 bg-sky-50 hover:bg-sky-100';
              case 'qa': return active
                ? 'bg-teal-500 text-white border-teal-600'
                : 'border-teal-500 text-teal-600 bg-teal-50 hover:bg-teal-100';
              case 'qc': return active
                ? 'bg-cyan-500 text-white border-cyan-600'
                : 'border-cyan-500 text-cyan-600 bg-cyan-50 hover:bg-cyan-100';
              case 'pm': return active
                ? 'bg-indigo-500 text-white border-indigo-600'
                : 'border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-100';
              case 'fm': return active
                ? 'bg-amber-500 text-white border-amber-600'
                : 'border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100';
              case 'hra': return active
                ? 'bg-pink-500 text-white border-pink-600'
                : 'border-pink-500 text-pink-600 bg-pink-50 hover:bg-pink-100';
              case 'cs': return active
                ? 'bg-lime-500 text-white border-lime-600'
                : 'border-lime-500 text-lime-600 bg-lime-50 hover:bg-lime-100';
              case 'sales': return active
                ? 'bg-orange-500 text-white border-orange-600'
                : 'border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100';
              case 'LVM-EXPAT': return active
                ? 'bg-violet-500 text-white border-violet-600'
                : 'border-violet-500 text-violet-600 bg-violet-50 hover:bg-violet-100';
              default: return active
                ? 'bg-gray-500 text-white border-gray-600'
                : 'border-gray-500 text-gray-600 bg-gray-50 hover:bg-gray-100';
            }
          };
          return (
            <button
              key={dept}
              role="tab"
              aria-selected={isActive}
              aria-controls={`dept-pane-${dept}`}
              id={`dept-tab-${dept}`}
              tabIndex={isActive ? 0 : -1}
                              className={`px-3 py-1.5 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
                  getTabColor(dept, isActive)
                }`}
              onClick={() => {
                setActiveTab(dept);
                setUserSelectedTab(true);
              }}
            >
              {DEPARTMENTS.find(d => d.value === dept)?.label || dept}
            </button>
          );
        })}
        {/* MAIN tab */}
        <button
          key="MAIN"
          role="tab"
          aria-selected={activeTab === "MAIN"}
          aria-controls="main-pane"
          id="main-tab"
          tabIndex={activeTab === "MAIN" ? 0 : -1}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "MAIN" 
              ? "border-b-2 bg-white shadow-sm border-slate-500 text-slate-700" 
              : "border-transparent border-slate-500 text-slate-600 bg-slate-50 hover:bg-slate-100"
          }`}
          onClick={() => {
            setActiveTab("MAIN");
            setUserSelectedTab(true);
          }}
        >
          MAIN
        </button>
        {/* ANALYTICS tab */}
        <button
          key="ANALYTICS"
          role="tab"
          aria-selected={activeTab === "ANALYTICS"}
          aria-controls="analytics-pane"
          id="analytics-tab"
          tabIndex={activeTab === "ANALYTICS" ? 0 : -1}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "ANALYTICS" 
              ? "border-b-2 bg-white shadow-sm border-sky-500 text-sky-700" 
              : "border-transparent border-sky-500 text-sky-600 bg-sky-50 hover:bg-sky-100"
          }`}
          onClick={() => {
            setActiveTab("ANALYTICS");
            setUserSelectedTab(true);
          }}
        >
          KPI
        </button>
        {/* PRODUCTION tab */}
        <button
          key="PRODUCTION"
          role="tab"
          aria-selected={activeTab === "PRODUCTION"}
          aria-controls="production-pane"
          id="production-tab"
          tabIndex={activeTab === "PRODUCTION" ? 0 : -1}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "PRODUCTION" 
              ? "border-b-2 bg-white shadow-sm border-orange-500 text-orange-700" 
              : "border-transparent border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100"
          }`}
          onClick={() => {
            setActiveTab("PRODUCTION");
            setUserSelectedTab(true);
          }}
        >
          PRODUCTION
        </button>
      </div>

      {/* Department Tab Content - Two Column Layout */}
      {activeTab === "MAIN" ? (
        <div
          id="main-pane"
          role="tabpanel"
          aria-labelledby="main-tab"
          className="p-2 sm:p-3 min-h-[400px] border border-gray-200 bg-gray-50 rounded-lg"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Panel: Project Status and Approval History */}
            <div className="lg:w-1/2 w-full">
              {/* Project Overview split into two cards */}
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                {/* Left Card: Name, Status, Description */}
                <div className="bg-white rounded-lg shadow p-2 flex-1 min-w-[180px]">
                  <h3 className="font-semibold text-base mb-2 text-gray-800">Project Overview</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Project Name:</span>
                      <span className="font-semibold text-gray-800">{project.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        project.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        project.status === "PENDING" ? "bg-orange-100 text-orange-800" :
                        project.status === "REJECTED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {project.status || "UNKNOWN"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-600">Description:</span>
                      <span className="text-gray-800 text-right max-w-xs text-xs">
                        {project.description || <span className="text-gray-400 italic">No description</span>}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Right Card: Edit Due Dates, Request Date, Department Due Dates */}
                <div className="bg-white rounded-lg shadow p-2 flex-1 min-w-[180px]">
                  <div className="flex flex-col gap-2">
                    {/* Edit Due Dates Button - Only for project owner */}
                    {project.ownerId === user?.id && (
                      <div className="flex justify-end mb-1">
                        <button
                          onClick={() => {
                            setShowDueDateEditor(true);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shadow-sm ${
                            showDueDateEditor 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {showDueDateEditor ? 'Due Date Editor Open' : 'Edit Due Dates'}
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800 text-[10px]">Project Request Date:</span>
                      <span className="text-gray-900 font-semibold text-right max-w-xs text-xs">
                        {project.requestDate ? new Date(project.requestDate).toLocaleDateString() : <span className="text-gray-400 italic">Not set</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800 text-[10px]">Department Due Dates:</span>
                      <div className="text-gray-800 text-right max-w-xs text-xs">
                        {project.departmentDueDates && Object.entries(project.departmentDueDates).length > 0 ? (
                          <ul className="list-none p-0 m-0">
                            {Object.entries(project.departmentDueDates).map(([dept, date]) => (
                              <li key={dept} className="text-[10px] text-gray-500">
                                 {DEPARTMENTS.find(d => d.value === dept)?.label || dept}: {new Date(date).toLocaleDateString()}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-2">
                <h3 className="font-semibold text-base mb-2 text-gray-800">Approval Status by Department</h3>
                <div className="space-y-2">
                  {(project.departments || []).map((dept: string) => {
                    const statusObj = approvalState[dept];
                    const logs = Array.isArray(statusObj) ? statusObj : statusObj ? [statusObj] : [];
                    const latest = logs.length > 0 ? logs[logs.length - 1] : null;
                    const status = latest ? latest.status : statusObj;
                    const timestamp = latest ? latest.timestamp : null;
                    const user = latest ? latest.user : null;
                    const deptLabel = DEPARTMENTS.find(d => d.value === dept)?.label || dept;
                    
                    return (
                      <div key={dept} className="border border-gray-200 rounded-lg p-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 text-xs">{deptLabel}</span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(status)}
                            <span className={`text-[10px] font-medium px-1 py-0.5 rounded-full ${
                              status === "APPROVED" ? "bg-green-100 text-green-800" :
                              status === "REJECTED" ? "bg-red-100 text-red-800" :
                              status === "PENDING" ? "bg-orange-100 text-orange-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {status || "NOT STARTED"}
                            </span>
                          </div>
                        </div>
                        {timestamp && (
                          <div className="text-[10px] text-gray-500">
                            {new Date(timestamp).toLocaleString()}
                            {user && <span className="ml-1 text-blue-600">by {user}</span>}
                          </div>
                        )}
                        {logs.length > 1 && (
                          <div className="mt-1 pt-1 border-t border-gray-100">
                            <div className="text-[10px] font-medium text-gray-600 mb-0.5">History:</div>
                            <div className="space-y-0.5">
                              {logs.slice(-3).map((log: any, idx: number) => {
                                let color = '';
                                if (log.status === 'REJECTED') color = 'text-red-600';
                                else if (log.status === 'APPROVED') color = 'text-green-600';
                                else if (log.status === 'PENDING') color = 'text-orange-600';
                                return (
                                  <div key={idx} className={`text-[10px] text-gray-500 ${color}`}>
                                    {log.status} by {log.user} at {new Date(log.timestamp).toLocaleString()}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel: Comments and Updates */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-white rounded-lg shadow p-2 h-full">
                <h3 className="font-semibold text-base mb-2 text-gray-800">Comments & Updates</h3>
                {/* Comment Form */}
                <form onSubmit={handleSubmitComment} className="mb-2">
                  <div className="flex gap-1 mb-2">
                    <select
                      value={commentType}
                      onChange={(e) => setCommentType(e.target.value as 'comment' | 'update')}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="comment">💬 Comment</option>
                      <option value="update">📝 Update</option>
                    </select>
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Add a ${commentType}...`}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {submittingComment ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <span>{commentType === 'comment' ? '💬' : '📝'}</span>
                          Post {commentType === 'comment' ? 'Comment' : 'Update'}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="border-t border-gray-200 pt-2">
                  <h4 className="font-medium text-gray-700 mb-2 text-xs">Recent Activity</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-gray-500 text-xs text-center py-4">
                        No comments or updates yet. Be the first to add one!
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="border border-gray-200 rounded-lg p-1">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <span className="text-base">
                                {comment.type === 'comment' ? '💬' : '📝'}
                              </span>
                              <span className="font-medium text-gray-800 text-xs">{comment.author}</span>
                              <span className="text-[10px] text-gray-500">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <span className={`text-[10px] px-1 py-0.5 rounded-full ${
                              comment.type === 'comment' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {comment.type === 'comment' ? 'Comment' : 'Update'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-700 whitespace-pre-wrap">
                            {comment.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "ANALYTICS" ? (
        <div
          id="analytics-pane"
          role="tabpanel"
          aria-labelledby="analytics-tab"
          className="p-4 sm:p-6 min-h-[400px] border border-gray-200 bg-gray-50 rounded-lg"
        >
          <ProjectAnalytics
            project={project}
            approvalState={approvalState}
            comments={comments}
            docs={allDocs} // Pass allDocs to ProjectAnalytics
            productionDocs={productionDocs}
          />
        </div>
      ) : activeTab === "PRODUCTION" ? (
        <div
          id="production-pane"
          role="tabpanel"
          aria-labelledby="production-tab"
          className="p-4 sm:p-6 min-h-[200px] border border-gray-200 bg-gray-50 rounded-lg"
        >
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-4">Production Documents</h3>
            <div className="bg-gray-100 rounded p-1 overflow-x-auto">
              {productionDocs.length === 0 ? (
                <div className="text-gray-400 text-xs">No production documents found.</div>
              ) : (
                <table className="w-full text-xs min-w-[400px]">
                  <thead>
                    <tr className="border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                      <th className="py-2 px-3 text-left font-medium text-xs w-2/5">File Name</th>
                      <th className="py-2 px-3 text-left font-medium text-xs w-1/5">Description</th>
                      <th className="py-2 px-3 text-center font-medium text-xs w-1/10 min-w-[80px]">Version</th>
                      <th className="py-2 px-3 text-left font-medium text-xs w-1/10 min-w-[80px]">Type</th>
                      <th className="py-2 px-3 text-left font-medium text-xs w-1/10 min-w-[100px]">Department</th>
                      <th className="py-2 px-3 text-left font-medium text-xs w-1/10 min-w-[100px]">Approved By</th>
                      <th className="py-2 px-3 text-left font-medium text-xs w-1/8 min-w-[120px]">Create Date</th>
                      <th className="py-2 px-3 text-center font-medium text-xs w-1/10 min-w-[60px]">Option</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionDocs.map((doc, index) => (
                      <tr key={doc.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-0.5 px-3 break-words w-2/5">{doc.fileName}</td>
                        <td className="py-0.5 px-3 break-words w-1/5">{doc.metadata?.description || ""}</td>
                        <td className="py-0.5 px-3 text-center w-1/10 min-w-[80px]">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            v{doc.version || 1}
                          </span>
                        </td>
                        <td className="py-0.5 px-3 w-1/10 min-w-[80px]">{doc.metadata?.type || ""}</td>
                        <td className="py-0.5 px-3 w-1/10 min-w-[100px]">{doc.department || ""}</td>
                        <td className="py-0.5 px-3 w-1/10 min-w-[100px]">{(doc.metadata as any)?.productionBy || ""}</td>
                        <td className="py-0.5 px-3 w-1/8 min-w-[120px]">{(doc.metadata as any)?.productionAt ? new Date((doc.metadata as any).productionAt).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false 
                        }) : ""}</td>
                        <td className="py-0.5 px-3 w-1/10 min-w-[60px]">
                          <div className="relative dropdown-container flex justify-center">
                            <button
                              onClick={() => toggleDropdown(doc.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Menu className="w-4 h-4 text-gray-600" />
                            </button>
                            {dropdownOpen === doc.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        (project.departments || []).map((dept: string) => {
          if (dept !== activeTab) return null;
          // Find the first image file for preview (jpg, jpeg, png, gif, webp, svg)
          const imageDoc = docs.find(doc => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(doc.fileName));
          return (
            <div
              key={dept}
              id={`dept-pane-${dept}`}
              role="tabpanel"
              aria-labelledby={`dept-tab-${dept}`}
              className="p-4 sm:p-6 min-h-[200px] border border-gray-200 bg-gray-50 rounded-lg"
            >
                            <div className="flex flex-col md:flex-row gap-4">
                {/* Left: Approval panel and PDF tools stacked vertically */}
                <div className="md:w-1/3 w-full flex flex-col gap-4">
                  {/* Approval status/history and buttons */}
                  <div className="bg-white rounded-lg shadow p-3 text-sm">
                    {/* Status information section */}
                    <div className="flex flex-row items-start justify-between gap-2 mb-4">
                      <div className="flex-1">
                        <span className="font-semibold">Status: </span>
                        {(() => {
                          const statusObj = approvalState[dept];
                          const logs = Array.isArray(statusObj) ? statusObj : statusObj ? [statusObj] : [];
                          const latest = logs.length > 0 ? logs[logs.length - 1] : null;
                          const status = latest ? latest.status : statusObj;
                          const timestamp = latest ? latest.timestamp : null;
                          const user = latest ? latest.user : null;
                          return (
                            <span className="capitalize" style={{ color: status === "APPROVED" ? "green" : status === "PENDING" ? "orange" : status === "REJECTED" ? "red" : undefined }}>
                              {status || "STARTED"}
                              {timestamp && (
                                <span className="ml-2 text-xs text-gray-400">{new Date(timestamp).toLocaleString()}</span>
                              )}
                              {user && (
                                <span className="ml-2 text-xs text-blue-600">by {user}</span>
                              )}
                              {/* Approval/reject history */}
                              {logs.length > 1 && (
                                <ul className="mt-1 text-xs">
                                  {logs.map((log: any, idx: number) => {
                                    let color = '';
                                    if (log.status === 'REJECTED') color = 'text-red-600';
                                    else if (log.status === 'APPROVED') color = 'text-green-600';
                                    else if (log.status === 'PENDING') color = 'text-orange-600';
                                    return (
                                      <li key={idx} className={color}>
                                        {log.status} by {log.user} at {new Date(log.timestamp).toLocaleString()}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                      {/* Status card on the right */}
                      <div className="px-2 py-1 border border-gray-200 bg-gray-50 rounded-lg text-xs min-w-[70px] min-h-[24px] flex flex-col items-center justify-center gap-0 ml-2">
                        <div className="font-semibold text-xs leading-tight">Status</div>
                        <div className={`font-bold text-xs leading-tight ${
                          project.status === "APPROVED" ? "text-green-600" :
                          project.status === "PENDING" ? "text-orange-600" :
                          project.status === "REJECTED" ? "text-red-600" :
                          "text-gray-600"
                        }`}>
                          {project.status || "UNKNOWN"}
                        </div>
                      </div>
                    </div>
                    
                    {/* Approval buttons section - centered */}
                    <div className="flex justify-center">
                      <div className="flex gap-2">
                        <button
                          className="w-20 px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center gap-1"
                          onClick={() => handleApproval("approved")}
                          disabled={!canApprove || activeTab !== dept}
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          className="w-20 px-2 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center gap-1"
                          onClick={() => handleApproval("disapproved")}
                          disabled={!canApprove || activeTab !== dept}
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                    {actionStatus && <div className="text-center mt-2"><span className="text-xs">{actionStatus}</span></div>}
                  </div>
                  
                  {/* PDF Tools Section */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <PDFTools 
                      projectId={projectId} 
                      department={dept} 
                      onDocumentsUpdated={() => {
                        // Refresh documents list
                        fetch(`/api/documents?projectId=${projectId}&department=${dept}`)
                          .then(res => res.json())
                          .then((data: Document[]) => setDocs(data));
                      }}
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
                  {canUpload && activeTab === dept && (
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
                                const canApproveDoc = isSeniorManagerOfDept && !isApproved && !isProduction;
                                const canSendToProduction = isSeniorManagerOfDept && isApproved && !isProduction;
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
                                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
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
            </div>
          );
        })
      )}



      {/* Document Viewer Modal */}
      {viewerOpen && viewerDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col" tabIndex={-1}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{viewerDoc.fileName}</h3>
              <button
                onClick={closeViewer}
                className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
                aria-label="Close document viewer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DocumentViewer
                filePath={viewerDoc.filePath}
                fileName={viewerDoc.fileName}
                documentId={viewerDoc.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Due Date Editor Modal */}
      {showDueDateEditor && project && (
        <div 
          className="fixed inset-0 bg-transparent flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDueDateEditor(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <DueDateEditor
              project={project}
              departments={project.departments || []}
              onSave={handleSaveDueDates}
              onCancel={() => setShowDueDateEditor(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
} 