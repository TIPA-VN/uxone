"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// Add Project type
type Project = {
  id: string;
  name: string;
  departments: string[];
  status: string;
  approvalState?: Record<string, any>; // allow array/object for logs
  createdAt: string;
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

export default function ProjectsPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
  };
  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatus(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, departments }),
    });
    if (res.ok) {
      setStatus("Project created!");
      setName("");
      setDescription("");
      setDepartments([]);
      fetchProjects();
    } else {
      setStatus("Failed to create project.");
    }
    setCreating(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <form onSubmit={handleCreate} className="space-y-4 bg-white p-4 rounded shadow mb-8">
        <div>
          <label className="block font-medium mb-1">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Departments for Approval</label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {DEPARTMENTS.map(d => (
              <label key={d.value} className="flex items-center gap-1 justify-start">
                <input
                  type="checkbox"
                  value={d.value}
                  checked={departments.includes(d.value)}
                  onChange={e => setDepartments(prev => e.target.checked ? [...prev, d.value] : prev.filter(x => x !== d.value))}
                  className="accent-blue-600"
                />
                <span className="text-xs">{d.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={creating || !name || departments.length === 0}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {creating ? "Creating..." : "Create Project"}
        </button>
        {status && <div className="text-center text-sm mt-2">{status}</div>}
      </form>
      <h2 className="text-xl font-bold mb-4">Project List</h2>
      <div className="bg-white rounded shadow p-4">
        {projects.length === 0 ? (
          <div className="text-gray-500">No projects yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Departments</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Approvals</th>
                <th className="py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => (
                <tr key={proj.id} className="border-b">
                  <td className="py-1 font-semibold">
                    <Link 
                      href={`/lvm/projects/${proj.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {proj.name}
                    </Link>
                  </td>
                  <td className="py-1">{(proj.departments || []).join(", ")}</td>
                  <td className="py-1">{proj.status}</td>
                  <td className="py-1">
                    {proj.approvalState && Object.entries(proj.approvalState).map(([dept, statObj]: [string, any]) => {
                      // If statObj is an array, get the latest log
                      const logs = Array.isArray(statObj) ? statObj : statObj ? [statObj] : [];
                      const latest = logs.length > 0 ? logs[logs.length - 1] : null;
                      const status = latest ? latest.status : statObj;
                      const timestamp = latest ? latest.timestamp : null;
                      const user = latest ? latest.user : null;
                      return (
                        <div key={dept} className="flex items-center gap-1">
                          <span className="text-xs font-medium">{dept}:</span>
                          <span className="text-xs capitalize" style={{ color: status === "APPROVED" ? "green" : status === "PENDING" ? "orange" : status === "REJECTED" ? "red" : undefined }}>{status}</span>
                          {timestamp && (
                            <span className="ml-1 text-xs text-gray-400">{new Date(timestamp).toLocaleString()}</span>
                          )}
                          {user && (
                            <span className="ml-1 text-xs text-blue-600">by {user}</span>
                          )}
                        </div>
                      );
                    })}
                  </td>
                  <td className="py-1">{new Date(proj.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 