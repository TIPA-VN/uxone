"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProjectAnalytics } from "@/components/ProjectAnalytics";
import { DueDateEditor } from "@/components/DueDateEditor";
import { PDFTools } from "@/components/PDFTools";

// Custom hooks
import { useProject } from "./hooks/useProject";
import { useDocuments } from "./hooks/useDocuments";
import { useTasks } from "./hooks/useTasks";
import { useComments } from "./hooks/useComments";

// Components
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectTabs } from "./components/ProjectTabs";
import { TasksTab } from "./components/TasksTab";
import { ProjectOverview } from "./components/ProjectOverview";
import { DepartmentTab } from "./components/DepartmentTab";
import { ProductionTab } from "./components/ProductionTab";

// Types

export default function ProjectDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  const { data: session } = useSession();
  const user = session?.user;

  // State
  const [activeTab, setActiveTab] = useState<string>("");
  const [urlTabHandled, setUrlTabHandled] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [showDueDateEditor, setShowDueDateEditor] = useState(false);


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
    } catch {
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
    } catch {
      setActionStatus("Failed to update due dates.");
    }
  };

  // Handle document actions






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
          <DepartmentTab
            projectId={projectId}
            department={activeTab}
            docs={documentsHook.docs}
            user={user}
            project={project}
            onDocumentAction={() => {
              documentsHook.fetchDocuments();
            }}
            onApproval={handleApproval}
            actionStatus={actionStatus}
          />
        )}

        {/* MAIN Tab */}
        {activeTab === "MAIN" && (
          <div className="max-w-6xl mx-auto">
            {/* Project Overview Section */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Project Overview</h2>
                </div>
                <ProjectOverview
                  project={project}
                  tasks={tasksHook.tasks}
                  user={user}
                  onUpdateProjectStatus={async (newStatus) => {
                    try {
                      const res = await fetch("/api/projects", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          projectIds: [projectId], 
                          updates: { status: newStatus } 
                        }),
                      });

                      if (res.ok) {
                        updateProject({ ...project, status: newStatus });
                      } else {
                        const errorData = await res.json();
                        if (errorData.error === "Cannot complete project with incomplete tasks") {
                          alert(`Cannot complete project. Please complete all tasks first.`);
                        } else if (errorData.error === "Cannot complete project with incomplete sub-tasks") {
                          alert(`Cannot complete project. Please complete all sub-tasks first.`);
                        } else {
                          alert(errorData.error || "Failed to update project status");
                        }
                      }
                    } catch (error) {
                      console.error("Error updating project status:", error);
                      alert("Failed to update project status");
                    }
                  }}
                  onEditDueDates={() => setShowDueDateEditor(true)}
                  showDueDateEditor={showDueDateEditor}
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Comments & Updates</h3>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {commentsHook.comments.length} comments
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={commentsHook.submitComment} className="mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Share your thoughts
                        </label>
                        <textarea
                          value={commentsHook.newComment}
                          onChange={(e) => commentsHook.setNewComment(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white shadow-sm text-sm"
                          placeholder="Write a comment or share an update about this project..."
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-xs text-gray-500">
                          {commentsHook.newComment.length}/500 characters
                        </div>
                        <button
                          type="submit"
                          disabled={commentsHook.submittingComment || !commentsHook.newComment.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer shadow-sm"
                        >
                          {commentsHook.submittingComment ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Submitting...
                            </div>
                          ) : (
                            "Post Comment"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="h-80 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50">
                  <div className="p-4 space-y-3">
                    {commentsHook.comments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      commentsHook.comments.map((comment) => (
                        <div key={comment.id} className="bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-700">
                                {comment.author.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-900">{comment.author.name}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TASKS Tab */}
        {activeTab === "tasks" && (
          <TasksTab
            projectId={projectId}
            tasks={tasksHook.tasks}
            users={tasksHook.users}
            onTaskCreated={() => {
              tasksHook.fetchTasks();
            }}
            onTaskStatusUpdated={(taskId, newStatus) => {
              tasksHook.updateTaskStatus(taskId, newStatus);
            }}
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
          <ProductionTab
            projectId={projectId}
            productionDocs={documentsHook.productionDocs}
            user={user}
            onRefresh={() => {
              documentsHook.fetchProductionDocuments();
            }}
          />
        )}
      </div>



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