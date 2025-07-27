"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProjectAnalytics } from "@/components/ProjectAnalytics";
import { DueDateEditor } from "@/components/DueDateEditor";
import { PDFTools } from "@/components/PDFTools";
import { DocumentViewer } from "@/components/DocumentViewer";

// Custom hooks
import { useProject } from "./hooks/useProject";
import { useDocuments } from "./hooks/useDocuments";
import { useTasks } from "./hooks/useTasks";
import { useComments } from "./hooks/useComments";

// Components
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectTabs } from "./components/ProjectTabs";
import { TasksTab } from "./components/TasksTab";

// Types
import { Project } from "./types/project";

export default function ProjectDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const { data: session } = useSession();
  const user = session?.user;

  // State
  const [activeTab, setActiveTab] = useState<string>("");
  const [urlTabHandled, setUrlTabHandled] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [showDueDateEditor, setShowDueDateEditor] = useState(false);
  const [dueDateEditorDepartment, setDueDateEditorDepartment] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Custom hooks
  const { project, loading, error, updateProject } = useProject(projectId);
  const documentsHook = useDocuments(projectId, activeTab);
  const tasksHook = useTasks(projectId);
  const commentsHook = useComments(projectId);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    if (urlTabHandled) return;
    
    const tabParam = searchParams.get('tab') || new URLSearchParams(window.location.search).get('tab');
    
    if (tabParam) {
      const tabMapping: Record<string, string> = {
        'kpi': 'ANALYTICS',
        'production': 'PRODUCTION',
        'main': 'MAIN',
        'tasks': 'tasks'
      };
      
      const mappedTab = tabMapping[tabParam.toLowerCase()];
      if (mappedTab) {
        setActiveTab(mappedTab);
      }
    } else if (project && !activeTab) {
      // Set default tab to first department or MAIN
      setActiveTab(project.departments?.[0] || "MAIN");
    }
    
    setUrlTabHandled(true);
  }, [searchParams, project, activeTab, urlTabHandled]);

  // Set initial tab when project loads
  useEffect(() => {
    if (project && !activeTab && !urlTabHandled) {
      setActiveTab(project.departments?.[0] || "MAIN");
    }
  }, [project, activeTab, urlTabHandled]);

  // Handle approval
  const handleApproval = async (action: "approved" | "disapproved") => {
    setActionStatus(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: activeTab, action }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        updateProject(updated);
        setActionStatus("Action successful!");
        setTimeout(() => setActionStatus(null), 3000);
      } else {
        setActionStatus("Action failed.");
      }
    } catch (error) {
      setActionStatus("Action failed.");
    }
  };

  // Handle due date save
  const handleSaveDueDates = async (requestDate: string, departmentDueDates: Record<string, string>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestDate, departmentDueDates }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        updateProject(updated);
        setShowDueDateEditor(false);
        setActionStatus("Due dates updated successfully!");
        setTimeout(() => setActionStatus(null), 3000);
      }
    } catch (error) {
      setActionStatus("Failed to update due dates.");
    }
  };

  // Handle document actions
  const handleViewDoc = (doc: any) => {
    setViewerDoc(doc);
    setViewerOpen(true);
  };

  const handleDownloadDoc = (doc: any) => {
    window.open(`/api/documents/${doc.id}/download`, '_blank');
  };

  const toggleDropdown = (docId: string) => {
    setDropdownOpen(dropdownOpen === docId ? null : docId);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerDoc(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading project: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Project Header */}
      <ProjectHeader
        project={project}
        user={user}
        onApproval={handleApproval}
        actionStatus={actionStatus}
        activeTab={activeTab}
      />

      {/* Project Tabs */}
      <ProjectTabs
        departments={project.departments || []}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {/* Department Tabs */}
        {project.departments?.includes(activeTab) && (
          <div className="space-y-6">
            {/* Document Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
              <form onSubmit={(e) => { e.preventDefault(); documentsHook.uploadDocument(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File *
                    </label>
                    <input
                      type="file"
                      ref={documentsHook.fileInputRef}
                      onChange={(e) => documentsHook.setFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      value={documentsHook.meta.type}
                      onChange={(e) => documentsHook.setMeta({ ...documentsHook.meta, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Document type"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={documentsHook.meta.description}
                      onChange={(e) => documentsHook.setMeta({ ...documentsHook.meta, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Document description"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="submit"
                    disabled={documentsHook.uploading || !documentsHook.file}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                  >
                    {documentsHook.uploading ? "Uploading..." : "Upload Document"}
                  </button>
                </div>
                
                {documentsHook.uploadStatus && (
                  <div className={`text-sm p-3 rounded-lg ${
                    documentsHook.uploadStatus.includes("successful") 
                      ? "bg-green-50 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {documentsHook.uploadStatus}
                  </div>
                )}
              </form>
            </div>

            {/* Document List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab} Documents ({documentsHook.docs.length})
                </h3>
              </div>
              
              {documentsHook.docs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documentsHook.docs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.fileName}</div>
                              {doc.metadata?.description && (
                                <div className="text-sm text-gray-500">{doc.metadata.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{doc.metadata?.type || "N/A"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{doc.workflowState || "Pending"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative">
                              <button
                                onClick={() => toggleDropdown(doc.id)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              
                              {dropdownOpen === doc.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                  <button
                                    onClick={() => handleViewDoc(doc)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDownloadDoc(doc)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  >
                                    Download
                                  </button>
                                  {doc.workflowState !== "APPROVED" && (
                                    <button
                                      onClick={() => documentsHook.approveDocument(doc.id)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                      {documentsHook.docActionStatus[doc.id] || "Approve"}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => documentsHook.deleteDocument(doc.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                                  >
                                    {documentsHook.docActionStatus[doc.id] || "Delete"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN Tab */}
        {activeTab === "MAIN" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="font-medium text-gray-700">Name:</dt>
                      <dd className="text-gray-900">{project.name}</dd>
                    </div>
                    {project.description && (
                      <div>
                        <dt className="font-medium text-gray-700">Description:</dt>
                        <dd className="text-gray-900">{project.description}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="font-medium text-gray-700">Status:</dt>
                      <dd className="text-gray-900">{project.status}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Departments</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.departments?.map((dept) => (
                      <span
                        key={dept}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments & Updates</h3>
              
              <form onSubmit={commentsHook.submitComment} className="mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add Comment
                    </label>
                    <textarea
                      value={commentsHook.newComment}
                      onChange={(e) => commentsHook.setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a comment or update..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="comment"
                          checked={commentsHook.commentType === 'comment'}
                          onChange={(e) => commentsHook.setCommentType(e.target.value as 'comment' | 'update')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Comment</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="update"
                          checked={commentsHook.commentType === 'update'}
                          onChange={(e) => commentsHook.setCommentType(e.target.value as 'comment' | 'update')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Update</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={commentsHook.submittingComment || !commentsHook.newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                    >
                      {commentsHook.submittingComment ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-4">
                {commentsHook.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          comment.type === 'update' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {comment.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TASKS Tab */}
        {activeTab === "tasks" && (
          <TasksTab
            tasks={tasksHook.tasks}
            users={tasksHook.users}
            showCreateTask={tasksHook.showCreateTask}
            setShowCreateTask={tasksHook.setShowCreateTask}
            creatingTask={tasksHook.creatingTask}
            taskForm={tasksHook.taskForm}
            setTaskForm={tasksHook.setTaskForm}
            onCreateTask={tasksHook.createTask}
            onUpdateTaskStatus={tasksHook.updateTaskStatus}
          />
        )}

        {/* ANALYTICS Tab */}
        {activeTab === "ANALYTICS" && (
          <ProjectAnalytics 
            project={project} 
            approvalState={project.approvalState || {}}
            comments={commentsHook.comments}
            docs={documentsHook.docs}
            productionDocs={documentsHook.productionDocs}
          />
        )}

        {/* PRODUCTION Tab */}
        {activeTab === "PRODUCTION" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Documents</h3>
              <PDFTools projectId={projectId} department={activeTab} />
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewerOpen && viewerDoc && (
        <DocumentViewer
          fileName={viewerDoc.fileName}
          filePath={viewerDoc.filePath}
        />
      )}

      {/* Due Date Editor Modal */}
      {showDueDateEditor && (
        <DueDateEditor
          project={project}
          departments={project.departments || []}
          onSave={handleSaveDueDates}
          onCancel={() => setShowDueDateEditor(false)}
        />
      )}
    </div>
  );
} 