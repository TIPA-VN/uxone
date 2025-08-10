"use client";
import { useEffect, useState, useRef } from "react";

type Document = {
  id: string;
  fileName: string;
  filePath: string;
  department?: string;
  createdAt: string;
  metadata?: {
    type?: string;
    project?: string;
    [key: string]: unknown;
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
];
const ROLES = ["ADMIN", "SENIOR MANAGER", "MANAGER", "SUPERVISOR", "USER"];

export default function DocumentUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ type: "", project: "", part: "", description: "" });
  const [department, setDepartment] = useState("");
  const [accessRoles, setAccessRoles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DOCUMENT_TYPES = [
    "request",
    "design",
    "routing",
    "testing",
    "purchasing",
    "quote",
    "manufacturing",
    "completed",
    "released",
  ];

  const fetchDocs = async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocs(data);
  };

  // Fetch docs on mount
  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!meta.type) {
      setUploadStatus("Please select a document type.");
      return;
    }
    setUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(meta));
    formData.append("department", department);
    accessRoles.forEach(r => formData.append("accessRoles", r));
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
      setMeta({ type: "", project: "", part: "", description: "" });
      setDepartment("");
      setAccessRoles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocs();
    } else {
      setUploadStatus("Upload failed.");
      setUploadResult(null);
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
        <p className="font-medium mb-1">ℹ️ Smart Versioning:</p>
        <p>The system automatically compares uploaded files with existing versions. Identical files won't create duplicate versions.</p>
      </div>
      
      <form onSubmit={handleUpload} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block font-medium mb-1">File</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              value={meta.type}
              onChange={e => setMeta(m => ({ ...m, type: e.target.value }))}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Select type</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Project</label>
            <input
              type="text"
              value={meta.project}
              onChange={e => setMeta(m => ({ ...m, project: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Part</label>
            <input
              type="text"
              value={meta.part}
              onChange={e => setMeta(m => ({ ...m, part: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={meta.description}
              onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
              rows={2}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Department</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Access Roles</label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => (
              <label key={r} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={accessRoles.includes(r)}
                  onChange={e => setAccessRoles(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))}
                  className="accent-blue-600"
                />
                <span className="text-xs">{r}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {uploadStatus && <div className="text-center text-sm mt-2">{uploadStatus}</div>}
        
        {/* Version Decision Details */}
        {uploadResult && uploadResult.versionDecision && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
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
      </form>
      <h2 className="text-xl font-bold mt-10 mb-4">Documents</h2>
      <div className="bg-white rounded shadow p-4">
        {docs.length === 0 ? (
          <div className="text-gray-500">No documents uploaded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">File</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Version</th>
                <th className="py-2 text-left">Project</th>
                <th className="py-2 text-left">Department</th>
                <th className="py-2 text-left">Uploaded</th>
                <th className="py-2 text-left">Download</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id} className="border-b">
                  <td className="py-1">{doc.fileName}</td>
                  <td className="py-1">{doc.metadata?.type || ""}</td>
                  <td className="py-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      v{doc.version || 1}
                    </span>
                  </td>
                  <td className="py-1">{doc.metadata?.project || ""}</td>
                  <td className="py-1">{doc.department || ""}</td>
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
  );
} 