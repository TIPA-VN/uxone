"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
];

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<any>(null);
  const [activeDept, setActiveDept] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ type: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const user = session?.user;

  // DEBUG: Log session user, activeDept, and approvalState
  console.log("Session user:", user);
  console.log("Active department:", activeDept);
  console.log("Project approvalState:", project?.approvalState);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/projects?id=${projectId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Fetched project data:", data); // <--- Add this line
        setProject(data);
        setActiveDept(data.departments?.[0] || "");
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !activeDept) return;
    fetch(`/api/documents?projectId=${projectId}&department=${activeDept}`)
      .then(res => res.json())
      .then(data => setDocs(data));
  }, [projectId, activeDept, uploading]);

  const canApprove =
    user &&
    user.department === activeDept &&
    project &&
    project.approvalState?.[activeDept] !== "approved" &&
    project.approvalState?.[activeDept] !== "disapproved";

  const canUpload = user && user.department === activeDept;

  const handleApproval = async (action: "approved" | "disapproved") => {
    setActionStatus(null);
    const res = await fetch(`/api/projects/${projectId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department: activeDept, action }),
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
    formData.append("department", activeDept);
    formData.append("projectId", projectId);
    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      setUploadStatus("Upload successful!");
      setFile(null);
      setMeta({ type: "", description: "" });
      fileInputRef.current?.value && (fileInputRef.current.value = "");
      setUploading(false);
      fetch(`/api/documents?projectId=${projectId}&department=${activeDept}`)
        .then(res => res.json())
        .then(data => setDocs(data));
    } else {
      setUploadStatus("Upload failed.");
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8 text-red-600">Project not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Project: {project.name}</h1>
      <div className="mb-4 text-gray-600">{project.description}</div>
      <div className="mb-6">
        <span className="font-semibold">Departments for Approval:</span>
        <span className="ml-2">{(project.departments || []).join(", ")}</span>
      </div>
      {/* Department Tabs */}
      <div className="flex gap-2 border-b mb-4">
        {(project.departments || []).map((dept: string) => (
          <button
            key={dept}
            className={`px-4 py-2 font-medium border-b-2 ${activeDept === dept ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500"}`}
            onClick={() => setActiveDept(dept)}
          >
            {DEPARTMENTS.find(d => d.value === dept)?.label || dept}
          </button>
        ))}
      </div>
      {/* Department Tab Content */}
      <div className="bg-white rounded shadow p-6 min-h-[200px]">
        <h2 className="text-lg font-bold mb-2">{DEPARTMENTS.find(d => d.value === activeDept)?.label || activeDept}</h2>
        <div className="mb-4">
          <span className="font-semibold">Approval Status: </span>
          <span className="capitalize" style={{ color: project.approvalState?.[activeDept] === "approved" ? "green" : project.approvalState?.[activeDept] === "pending" ? "orange" : project.approvalState?.[activeDept] === "disapproved" ? "red" : undefined }}>
            {project.approvalState?.[activeDept] || "started"}
          </span>
        </div>
        {canApprove && (
          <div className="mb-4 flex gap-2">
            <button
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              onClick={() => handleApproval("approved")}
            >
              Approve
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleApproval("disapproved")}
            >
              Disapprove
            </button>
            {actionStatus && <span className="ml-2 text-sm">{actionStatus}</span>}
          </div>
        )}
        {/* Document upload/list UI */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Documents for {DEPARTMENTS.find(d => d.value === activeDept)?.label || activeDept}</h3>
          {canUpload && (
            <form onSubmit={handleUpload} className="mb-4 flex flex-col gap-2 bg-gray-50 p-3 rounded">
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => setFile(e.target.files?.[0] || null)}
                required
                className="border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Type (e.g. spec, drawing)"
                value={meta.type}
                onChange={e => setMeta(m => ({ ...m, type: e.target.value }))}
                className="border rounded px-2 py-1"
              />
              <textarea
                placeholder="Description"
                value={meta.description}
                onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                className="border rounded px-2 py-1"
                rows={2}
              />
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              {uploadStatus && <div className="text-center text-xs mt-1">{uploadStatus}</div>}
            </form>
          )}
          <div className="bg-white rounded shadow p-2">
            {docs.length === 0 ? (
              <div className="text-gray-400">No documents for this department.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 text-left">File</th>
                    <th className="py-1 text-left">Type</th>
                    <th className="py-1 text-left">Description</th>
                    <th className="py-1 text-left">Uploaded</th>
                    <th className="py-1 text-left">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id} className="border-b">
                      <td className="py-1">{doc.fileName}</td>
                      <td className="py-1">{doc.metadata?.type || ""}</td>
                      <td className="py-1">{doc.metadata?.description || ""}</td>
                      <td className="py-1">{new Date(doc.createdAt).toLocaleString()}</td>
                      <td className="py-1">
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
    </div>
  );
} 