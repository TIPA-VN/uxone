"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Plus, 
  Users, 
  Menu,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { Project } from "@/types";
import { getActiveDepartments } from "@/config/app";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [documentTemplate, setDocumentTemplate] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // NEW: Contract integration fields
  const [projectType, setProjectType] = useState<string>("GENERAL");
  const [contractType, setContractType] = useState<string>("");
  const [counterparty, setCounterparty] = useState<string>("");
  const [contractValue, setContractValue] = useState<string>("");
  const [contractCurrency, setContractCurrency] = useState<string>("THB");

  // NEW: Project type filter for the projects list
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("ALL");

  const { 
    projects, 
    loading, 
    createProject 
    
  } = useProjects();

  const [documentTemplates, setDocumentTemplates] = useState<Array<{ id: string; templateName: string; prefix: string }>>([]);

  // Get active departments for the form
  const activeDepartments = getActiveDepartments();

  // Fetch document templates from database
  const fetchTemplates = useCallback(async () => {
    try {
      console.log('Fetching document templates...');
      const response = await fetch('/api/document-templates');
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Document templates received:', data);
        setDocumentTemplates(data);
      } else {
        console.error('Failed to fetch templates, status:', response.status);
        const errorData = await response.json();
        console.error('Error data:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch document templates:', error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatus(null);
    
    const success = await createProject({ 
      name, 
      description, 
      departments,
      documentTemplateId: documentTemplate || undefined,
      // NEW: Contract integration data
      projectType,
      contractDetails: projectType === "CONTRACT" ? {
        contractType: contractType || undefined,
        counterparty: counterparty || undefined,
        value: contractValue ? parseFloat(contractValue) : undefined,
        currency: contractCurrency,
        contractStatus: "DRAFT"
      } : undefined
    });
    
    if (success) {
      setStatus("Project created successfully!");
      setName("");
      setDescription("");
      setDepartments([]);
      setDocumentTemplate("");
      // NEW: Reset contract fields
      setProjectType("GENERAL");
      setContractType("");
      setCounterparty("");
      setContractValue("");
      setContractCurrency("THB");
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

  // NEW: Apply project type filter
  const filteredMyProjects = myProjects.filter(project => 
    projectTypeFilter === "ALL" || project.projectType === projectTypeFilter
  );
  const filteredProjectsIBelongTo = projectsIBelongTo.filter(project => 
    projectTypeFilter === "ALL" || project.projectType === projectTypeFilter
  );

  const projectColumns = [
    {
      key: "project",
      header: "Project",
      sortable: true,
      sortKey: "name",
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
            <div className="flex items-center gap-2">
              <Link 
                href={`/lvm/projects/${project.id}?tab=kpi`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                {project.name}
              </Link>
              {project.projectType === "CONTRACT" && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1"></span>
                  CONTRACT
                </span>
              )}
            </div>
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
      key: "documentNumber",
      header: "Document #",
      sortable: true,
      sortKey: "documentNumber",
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
      key: "documentTemplate",
      header: "Template",
      sortable: true,
      sortKey: "documentTemplate",
      render: (project: Project) => (
        <div className="text-sm">
          {project.documentTemplate ? (
            <span className="text-gray-700 bg-blue-100 px-2 py-1 rounded text-xs">
              {documentTemplates.find(t => t.id === project.documentTemplate)?.templateName || 'Unknown'}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">None</span>
          )}
        </div>
      )
    },
    {
      key: "contractInfo",
      header: "Contract",
      sortable: false,
      render: (project: Project) => (
        <div className="text-sm">
          {project.projectType === "CONTRACT" ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                Contract
              </span>
              {project.contractDetails && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">
                    {project.contractDetails.contractType || 'Unknown Type'}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    project.contractDetails.contractStatus === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    project.contractDetails.contractStatus === 'REVIEW' ? 'bg-blue-100 text-blue-800' :
                    project.contractDetails.contractStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    project.contractDetails.contractStatus === 'SIGNED' ? 'bg-indigo-100 text-indigo-800' :
                    project.contractDetails.contractStatus === 'EXECUTING' ? 'bg-purple-100 text-purple-800' :
                    project.contractDetails.contractStatus === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {project.contractDetails.contractStatus || 'DRAFT'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
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
      sortable: false,
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
                href={`/lvm/projects/${project.id}?tab=kpi`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                ANALYTICS
              </Link>
              <Link
                href={`/lvm/projects/${project.id}`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                MAIN
              </Link>
              {project.projectType === "CONTRACT" && (
                <Link
                  href={`/lvm/projects/${project.id}?tab=contract`}
                  className="block px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 cursor-pointer text-left font-medium"
                >
                  CONTRACT
                </Link>
              )}
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

        {/* Contract Status Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">C</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Contracts</p>
                <p className="text-2xl font-bold text-purple-600">
                  {projects.filter(p => p.projectType === "CONTRACT").length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-yellow-600">D</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {projects.filter(p => p.projectType === "CONTRACT" && p.contractDetails?.contractStatus === "DRAFT").length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">R</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">In Review</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.projectType === "CONTRACT" && p.contractDetails?.contractStatus === "REVIEW").length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">A</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.projectType === "CONTRACT" && p.contractDetails?.contractStatus === "APPROVED").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Type Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setProjectTypeFilter("ALL")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  projectTypeFilter === "ALL"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setProjectTypeFilter("GENERAL")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  projectTypeFilter === "GENERAL"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setProjectTypeFilter("CONTRACT")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  projectTypeFilter === "CONTRACT"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Contracts
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
              
              {/* NEW: Project Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type *
                </label>
                <select
                  value={projectType}
                  onChange={e => setProjectType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="GENERAL">General Project</option>
                  <option value="CONTRACT">Contract Project</option>
                  <option value="SERVICE">Service Project</option>
                  <option value="MAINTENANCE">Maintenance Project</option>
                  <option value="RESEARCH">Research Project</option>
                </select>
              </div>
              
              {/* Document Template - Available for ALL project types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Document Template
                </label>
                <select
                  value={documentTemplate}
                  onChange={e => setDocumentTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a document template</option>
                  {documentTemplates.map((template: { id: string; templateName: string; prefix: string }) => (
                    <option key={template.id} value={template.id}>
                      {template.templateName} ({template.prefix})
                    </option>
                  ))}
                </select>
                {/* Debug info */}
                <p className="text-xs text-gray-500 mt-1">
                  Available templates: {documentTemplates.length} | 
                  Selected: {documentTemplate || 'None'}
                </p>
              </div>
              
              {/* NEW: Contract Fields (Conditional) */}
              {projectType === "CONTRACT" && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Type
                      </label>
                      <select
                        value={contractType}
                        onChange={e => setContractType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select contract type</option>
                        <option value="PURCHASE_CONTRACT">Purchase Contract</option>
                        <option value="SERVICE_AGREEMENT">Service Agreement</option>
                        <option value="NDA">Non-Disclosure Agreement</option>
                        <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Counterparty
                      </label>
                      <input
                        type="text"
                        value={counterparty}
                        onChange={e => setCounterparty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter counterparty name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Value
                      </label>
                      <input
                        type="number"
                        value={contractValue}
                        onChange={e => setContractValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter contract value"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={contractCurrency}
                        onChange={e => setContractCurrency(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="THB">THB (Thai Baht)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="JPY">JPY (Japanese Yen)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Departments for Approval *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {activeDepartments.map(d => (
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

              {documentTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Number Preview
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-sm text-blue-700 font-mono">
                    {(() => {
                      const template = documentTemplates.find(t => t.id === documentTemplate);
                      if (template) {
                        const currentYear = new Date().getFullYear();
                        return `${template.prefix}-${currentYear}-[XXX]`;
                      }
                      return 'Template not found';
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Document number will be automatically generated when project is created
                  </p>
                </div>
              )}

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

        {/* Projects List - Two Sections - Vertical Layout */}
        <div className="space-y-6">
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

            <div className="overflow-x-auto overflow-y-visible pb-8">
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
                  data={filteredMyProjects}
                  columns={projectColumns}
                  loading={loading}
                  emptyMessage="No owned projects"
                  searchable={true}
                  searchPlaceholder="Search owned projects by name, description, document number, status, or owner..."
                  searchKeys={['name', 'description', 'documentNumber', 'status', 'owner.name', 'owner.username', 'owner.department']}
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

            <div className="overflow-x-auto overflow-y-visible pb-8">
              {projectsIBelongTo.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No projects to review</h3>
                  <p className="text-xs text-gray-600">You&apos;ll see projects here when they&apos;re assigned to your department</p>
                </div>
              ) : (
                <DataTable
                  data={filteredProjectsIBelongTo}
                  columns={projectColumns}
                  loading={loading}
                  emptyMessage="No projects to review"
                  searchable={true}
                  searchPlaceholder="Search projects by name, description, document number, status, or owner..."
                  searchKeys={['name', 'description', 'documentNumber', 'status', 'owner.name', 'owner.username', 'owner.department']}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 