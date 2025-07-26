"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Menu } from "lucide-react";

// Add Project type
type Project = {
  id: string;
  name: string;
  description?: string;
  departments: string[];
  status: string;
  approvalState?: Record<string, any>; // allow array/object for logs
  createdAt: string;
  ownerId?: string;
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

const getStatusIcon = (status: string) => {
  switch(status?.toUpperCase()) {
    case "APPROVED":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "REJECTED":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "PENDING":
      return <Clock className="w-4 h-4 text-orange-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch(status?.toUpperCase()) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    case "PENDING":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
      setStatus("Project created successfully!");
      setName("");
      setDescription("");
      setDepartments([]);
      setShowCreateForm(false);
      fetchProjects();
    } else {
      setStatus("Failed to create project.");
    }
    setCreating(false);
  };

  const handleMenuToggle = (projectId: string) => {
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and track project approvals across departments
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in the details below to create a new project</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Enter project description"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Departments for Approval *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DEPARTMENTS.map(d => (
                    <label key={d.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={d.value}
                        checked={departments.includes(d.value)}
                        onChange={e => setDepartments(prev => e.target.checked ? [...prev, d.value] : prev.filter(x => x !== d.value))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !name || departments.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
              
              {status && (
                <div className={`text-sm p-3 rounded-lg ${
                  status.includes("successfully") 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {status}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Projects List - Two Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects I Own */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Projects I Own</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{projects.filter(p => p.ownerId === user?.id).length} project{projects.filter(p => p.ownerId === user?.id).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
              {projects.filter(p => p.ownerId === user?.id).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No owned projects</h3>
                  <p className="text-xs text-gray-600 mb-3">Create a project to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Project
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.filter(p => p.ownerId === user?.id).map((proj, index) => (
                      <tr 
                        key={proj.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {proj.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <Link 
                                href={`/lvm/projects/${proj.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {proj.name}
                              </Link>
                              {proj.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {proj.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(proj.status)}
                            <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(proj.status)}`}>
                              {proj.status || "UNKNOWN"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(proj.id);
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                            >
                              <Menu className="w-3 h-3 text-gray-500" />
                            </button>
                            
                            {openMenuId === proj.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20"
                                onClick={handleMenuClick}
                              >
                                <Link
                                  href={`/lvm/projects/${proj.id}`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  MAIN
                                </Link>
                                <Link
                                  href={`/lvm/projects/${proj.id}?tab=kpi`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  KPI
                                </Link>
                                <Link
                                  href={`/lvm/projects/${proj.id}?tab=production`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  PRODUCTION
                                </Link>
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

          {/* Projects I Belong To */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Projects I Belong To</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{projects.filter(p => p.ownerId !== user?.id && p.departments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).length} project{projects.filter(p => p.ownerId !== user?.id && p.departments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
              {projects.filter(p => p.ownerId !== user?.id && p.departments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No projects to review</h3>
                  <p className="text-xs text-gray-600">You'll see projects here when they're assigned to your department</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.filter(p => p.ownerId !== user?.id && p.departments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).map((proj, index) => (
                      <tr 
                        key={proj.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-medium text-green-600">
                                  {proj.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <Link 
                                href={`/lvm/projects/${proj.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {proj.name}
                              </Link>
                              {proj.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {proj.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(proj.status)}
                            <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(proj.status)}`}>
                              {proj.status || "UNKNOWN"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(proj.id);
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                            >
                              <Menu className="w-3 h-3 text-gray-500" />
                            </button>
                            
                            {openMenuId === proj.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20"
                                onClick={handleMenuClick}
                              >
                                <Link
                                  href={`/lvm/projects/${proj.id}`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  MAIN
                                </Link>
                                <Link
                                  href={`/lvm/projects/${proj.id}?tab=kpi`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  KPI
                                </Link>
                                <Link
                                  href={`/lvm/projects/${proj.id}?tab=production`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  PRODUCTION
                                </Link>
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
      </div>
    </div>
  );
} 