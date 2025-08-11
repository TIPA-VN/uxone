"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Eye, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Database,
  FileText,
  Users,
  CheckCircle,
  XCircle
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  ownerId: string;
  departments: string[];
  documentNumber?: string;
  documentTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    username: string;
    department?: string;
  };
  _count: {
    tasks: number;
    documents: number;
    comments: number;
    members: number;
    documentNumbers: number;
  };
}

interface DeleteConfirmation {
  projectId: string;
  projectName: string;
  relatedData: {
    tasks: number;
    documents: number;
    comments: number;
    members: number;
    documentNumbers: number;
  };
}

export default function ProjectManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if user has admin access or is IS department manager
  const hasAdminRole = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'].includes(session?.user?.role || '');
  const isISDepartment = session?.user?.department === 'IS';
  
  if (!session?.user || (!hasAdminRole && !isISDepartment)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch projects' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching projects' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (project: Project) => {
    // Fetch detailed project info for deletion confirmation
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/details`);
      if (response.ok) {
        const details = await response.json();
        setDeleteConfirmation({
          projectId: project.id,
          projectName: project.name,
          relatedData: details.relatedData
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching project details' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/projects/${deleteConfirmation.projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Project "${deleteConfirmation.projectName}" deleted successfully` });
        setProjects(prev => prev.filter(p => p.id !== deleteConfirmation.projectId));
        setDeleteConfirmation(null);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete project' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting project' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.owner.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.documentNumber && project.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const projectColumns = [
    {
      key: "project",
      header: "Project",
      render: (project: Project) => (
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{project.name}</div>
            {project.description && (
              <div className="text-xs text-gray-500 line-clamp-1">{project.description}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              Owner: {project.owner.username} ({project.owner.department || 'No dept'})
            </div>
          </div>
        </div>
      )
    },
    {
      key: "documentNumber",
      header: "Document #",
      render: (project: Project) => (
        <div className="text-sm">
          {project.documentNumber ? (
            <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
              {project.documentNumber}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">Not assigned</span>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (project: Project) => (
        <StatusBadge status={project.status || "UNKNOWN"} size="sm" />
      )
    },
    {
      key: "departments",
      header: "Departments",
      render: (project: Project) => (
        <div className="flex flex-wrap gap-1">
          {project.departments.map((dept, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {dept}
            </span>
          ))}
        </div>
      )
    },
    {
      key: "relatedData",
      header: "Related Data",
      render: (project: Project) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-500" />
            <span>{project._count.members} members</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-gray-500" />
            <span>{project._count.documents} docs</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3 text-gray-500" />
            <span>{project._count.tasks} tasks</span>
          </div>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (project: Project) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/lvm/projects/${project.id}`)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="View Project"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </button>
          <button
            onClick={() => handleDeleteClick(project)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-1">Admin tool for managing and deleting projects</p>
            </div>
            <button
              onClick={fetchProjects}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, owners, or document numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Projects ({filteredProjects.length})</h2>
              <div className="text-sm text-gray-600">
                Total: {projects.length} projects
              </div>
            </div>
          </div>

          <DataTable
            data={filteredProjects}
            columns={projectColumns}
            loading={loading}
            emptyMessage="No projects found"
          />
        </div>

        {/* Message Display */}
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Project</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Are you sure you want to delete <strong>"{deleteConfirmation.projectName}"</strong>?
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-800 mb-2">The following data will also be deleted:</p>
                    <div className="space-y-1 text-xs text-red-700">
                      <div className="flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        <span>{deleteConfirmation.relatedData.tasks} tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        <span>{deleteConfirmation.relatedData.documents} documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>{deleteConfirmation.relatedData.members} team members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3">#</span>
                        <span>{deleteConfirmation.relatedData.documentNumbers} document numbers</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    disabled={deleting}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
