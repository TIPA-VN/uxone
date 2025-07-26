"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { PDFTools } from "@/components/PDFTools";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  departments: string[];
  approvalState?: Record<string, any>; // allow array/object for logs
  // add other fields as needed
};

  type Document = {
    id: string;
    fileName: string;
    filePath: string;
    createdAt: string;
    version?: number;
    department?: string;
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
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ type: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const user = session?.user;

  // DEBUG: Log session user, activeDept, and approvalState
  console.log("Session user:", user);
  console.log("Active department:", activeTab);
  console.log("Project approvalState:", project?.approvalState);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/projects?id=${projectId}`)
      .then(res => res.json())
      .then(data => {
        let proj = Array.isArray(data)
          ? data.find((p: any) => String(p.id) === String(projectId))
          : data;
        console.log("Looking for projectId:", projectId, "in", Array.isArray(data) ? data.map((p: any) => p.id) : data);
        setProject(proj);
        setLoading(false);
        // Extra debug: log departments and approvalState
        if (proj) {
          console.log("Set project:", proj);
          console.log("Set project.departments:", proj.departments);
          console.log("Set project.approvalState:", proj.approvalState);
        } else {
          console.error("Project not found for id:", projectId, "API response:", data);
        }
      });
  }, [projectId]);

  // Always set activeDept to the first department after project loads
  useEffect(() => {
    if (project && Array.isArray(project.departments) && project.departments.length > 0) {
      setActiveTab(project.departments[0]);
    } else {
      setActiveTab("");
    }
  }, [project]);

  useEffect(() => {
    if (!projectId || !activeTab || activeTab === "MAIN") return;
    fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
      .then(res => res.json())
      .then(data => setDocs(data));
  }, [projectId, activeTab, uploading]);

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
      setUploading(false);
      fetch(`/api/documents?projectId=${projectId}&department=${activeTab}`)
        .then(res => res.json())
        .then(data => setDocs(data));
    } else {
      setUploadStatus("Upload failed.");
      setUploading(false);
    }
  };

  // Defensive fallback rendering for missing departments or approvalState
  if (project && (!Array.isArray(project.departments) || project.departments.length === 0)) {
    console.error("No departments found for this project. Value:", project.departments);
    return <div className="p-8 text-red-600">No departments found for this project.</div>;
  }
  if (project && !project.approvalState) {
    console.error("No approvalState found for this project. Value:", project.approvalState);
    return <div className="p-8 text-red-600">No approval state found for this project.</div>;
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8 text-red-600">Project not found.</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Status card removed from top */}

      <div className="flex flex-wrap gap-2 border-b mb-4" role="tablist" aria-label="Department Tabs">
        {(project.departments || []).map((dept: string) => {
          const isActive = activeTab === dept;
          return (
            <button
              key={dept}
              role="tab"
              aria-selected={isActive}
              aria-controls={`dept-pane-${dept}`}
              id={`dept-tab-${dept}`}
              tabIndex={isActive ? 0 : -1}
              className={`px-4 py-2 font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
                isActive ? "border-blue-600 text-blue-700 bg-white shadow" : "border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab(dept)}
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
          className={`px-4 py-2 font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "MAIN" ? "border-blue-600 text-blue-700 bg-white shadow" : "border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("MAIN")}
        >
          MAIN
        </button>
      </div>

      {/* Department Tab Content - Two Column Layout */}
      {activeTab === "MAIN" ? (
        <div
          id="main-pane"
          role="tabpanel"
          aria-labelledby="main-tab"
          className="p-4 sm:p-6 min-h-[120px] border border-gray-200 bg-gray-50 rounded-lg text-sm"
        >
          <div className="mb-2">
            <span className="font-semibold">Project Name: </span>{project.name}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Description: </span>{project.description || <span className="text-gray-400">No description</span>}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Status: </span>
            <span className={`font-bold text-xs ${
              project.status === "APPROVED" ? "text-green-600" :
              project.status === "PENDING" ? "text-orange-600" :
              project.status === "REJECTED" ? "text-red-600" :
              "text-gray-600"
            }`}>
              {project.status || "UNKNOWN"}
            </span>
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
                {/* Left: Approval status/history and buttons */}
                <div className="md:w-1/2 w-full bg-white rounded-lg shadow p-3 flex flex-col justify-between mb-2 md:mb-0 text-sm">
                  <div className="flex flex-row items-start justify-between gap-2">
                    <div className="mb-2 flex-1">
                      <span className="font-semibold">Approval Status: </span>
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
                  <div className="flex flex-col gap-1">
                    <button
                      className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      onClick={() => handleApproval("approved")}
                      disabled={!canApprove || activeTab !== dept}
                    >
                      Approve
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      onClick={() => handleApproval("disapproved")}
                      disabled={!canApprove || activeTab !== dept}
                    >
                      Disapprove
                    </button>
                    {actionStatus && <span className="ml-2 text-xs">{actionStatus}</span>}
                  </div>
                </div>
                {/* Right: Document upload form and list */}
                <div className="md:w-1/2 w-full bg-white rounded-lg shadow p-3 text-sm">
                  <h3 className="font-semibold mb-1">Upload Document</h3>
                  {canUpload && activeTab === dept && (
                    <form onSubmit={handleUpload} className="flex flex-col gap-2 mb-2">
                      <label className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs">File</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={e => setFile(e.target.files?.[0] || null)}
                          required
                          className="border rounded px-2 py-1 text-xs"
                        />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs">Type</span>
                        <input
                          type="text"
                          placeholder="Type (e.g. spec, drawing)"
                          value={meta.type}
                          onChange={e => setMeta(m => ({ ...m, type: e.target.value }))}
                          className="border rounded px-2 py-1 text-xs"
                        />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs">Description</span>
                        <textarea
                          placeholder="Description"
                          value={meta.description}
                          onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                          className="border rounded px-2 py-1 text-xs"
                          rows={2}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={uploading}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs"
                      >
                        {uploading ? "Uploading..." : "Upload"}
                      </button>
                      {uploadStatus && <div className="text-center text-xs mt-1">{uploadStatus}</div>}
                    </form>
                  )}
                  <div className="bg-gray-100 rounded p-1 overflow-x-auto">
                    {docs.length === 0 ? (
                      <div className="text-gray-400 text-xs">No documents for this department.</div>
                    ) : (
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="border-b">
                            <th className="py-0.5 text-left">File</th>
                            <th className="py-0.5 text-left">Type</th>
                            <th className="py-0.5 text-left">Description</th>
                            <th className="py-0.5 text-left">Uploaded</th>
                            <th className="py-0.5 text-left">Download</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map(doc => (
                            <tr key={doc.id} className="border-b">
                              <td className="py-0.5 break-words max-w-[120px]">{doc.fileName}</td>
                              <td className="py-0.5">{doc.metadata?.type || ""}</td>
                              <td className="py-0.5 break-words max-w-[120px]">{doc.metadata?.description || ""}</td>
                              <td className="py-0.5">{new Date(doc.createdAt).toLocaleString()}</td>
                              <td className="py-0.5">
                                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
                             {/* PDF Tools Section */}
               <div className="w-full bg-white rounded-lg shadow p-4 mt-4">
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
          );
        })
      )}

      {/* Approval Timeline only for MAIN tab */}
      {activeTab === "MAIN" && (
        <div className="p-4 sm:p-6 mt-8 border border-gray-200 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-bold mb-4">Approval Timeline</h2>
          <div className="space-y-4">
            {(project.departments || []).map((dept: string) => {
              const statusObj = approvalState[dept];
              // If statusObj is an array, get the latest log
              const logs = Array.isArray(statusObj) ? statusObj : statusObj ? [statusObj] : [];
              const latest = logs.length > 0 ? logs[logs.length - 1] : null;
              const status = latest ? latest.status : statusObj;
              const timestamp = latest ? latest.timestamp : null;
              const user = latest ? latest.user : null;
              const deptLabel = DEPARTMENTS.find(d => d.value === dept)?.label || dept;
              return (
                <div key={dept} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{deptLabel}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {status || "Not started"}
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
                    </div>
                  </div>
                  {status === "APPROVED" && (
                    <div className="text-sm text-green-600">✓ Approved</div>
                  )}
                  {status === "REJECTED" && (
                    <div className="text-sm text-red-600">✗ Disapproved</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 