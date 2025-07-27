"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Users, AlertCircle, Menu } from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { Project } from "@/types";
import { APP_CONFIG } from "@/config/app";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { 
    projects, 
    loading, 
    error, 
    createProject 
  } = useProjects();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatus(null);
    
    const success = await createProject({ name, description, departments });
    
    if (success) {
      setStatus("Project created successfully!");
      setName("");
      setDescription("");
      setDepartments([]);
      setShowCreateForm(false);
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
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  if (openMenuId) {
    document.addEventListener('click', handleClickOutside);
    setTimeout(() => document.removeEventListener('click', handleClickOutside), 0);
  }

  const myProjects = projects.filter(p => p.ownerId === user?.id);
  const projectsIBelongTo = projects.filter(p => 
    p.ownerId !== user?.id && 
    p.departments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())
  );

  const projectColumns = [
    {
      key: "project",
      header: "Project",
      render: (project: Project) => (
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-2">
            <Link 
              href={`/lvm/projects/${project.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {project.name}
            </Link>
            {project.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (project: Project) => (
        <div className="flex items-center">
          <StatusBadge status={project.status || "UNKNOWN"} size="sm" />
          {project.ownerId === user?.id && project._count?.tasks && project._count.tasks > 0 && (
            <div className="ml-2 flex items-center gap-1">
              <span className="text-xs text-gray-500">Tasks:</span>
              <span className={`text-xs font-medium px-1 py-0.5 rounded ${
                project._count.tasks > 0 && project._count.tasks === (project._count.completedTasks || 0)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {project._count.completedTasks || 0}/{project._count.tasks}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (project: Project) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMenuToggle(project.id);
            }}
            className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
          >
            <Menu className="w-3 h-3 text-gray-500" />
          </button>
          
          {openMenuId === project.id && (
            <div 
              className="absolute right-0 top-full mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
              onClick={handleMenuClick}
            >
              <Link
                href={`/lvm/projects/${project.id}`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                MAIN
              </Link>
              <Link
                href={`/lvm/projects/${project.id}?tab=kpi`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                KPI
              </Link>
              <Link
                href={`/lvm/projects/${project.id}?tab=production`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                PRODUCTION
              </Link>
            </div>
          )}
        </div>
      )
    }
  ];

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
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
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
                  {APP_CONFIG.departments.map(d => (
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Projects I Own</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{myProjects.length} project{myProjects.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible pb-16">
              {myProjects.length === 0 ? (
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
                <DataTable
                  data={myProjects}
                  columns={projectColumns}
                  loading={loading}
                  emptyMessage="No owned projects"
                />
              )}
            </div>
          </div>

          {/* Projects I Belong To */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Projects I Belong To</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{projectsIBelongTo.length} project{projectsIBelongTo.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible pb-16">
              {projectsIBelongTo.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No projects to review</h3>
                  <p className="text-xs text-gray-600">You'll see projects here when they're assigned to your department</p>
                </div>
              ) : (
                <DataTable
                  data={projectsIBelongTo}
                  columns={projectColumns}
                  loading={loading}
                  emptyMessage="No projects to review"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 