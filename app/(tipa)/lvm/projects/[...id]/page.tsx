"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProjectAnalytics } from "@/components/ProjectAnalytics";
import { DueDateEditor } from "@/components/DueDateEditor";

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
      <div className="mt-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Project Overview */}
            <div className="space-y-6">
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

            {/* Right Column: Comments Section */}
            <div className="space-y-6">
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
                          <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  ))}
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