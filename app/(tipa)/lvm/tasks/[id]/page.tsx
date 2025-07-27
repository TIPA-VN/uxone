"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Paperclip, 
  Download, 
  X, 
  Plus,
  ChevronLeft,
  Edit,
  Eye
} from "lucide-react";
import Link from "next/link";
import TaskDependencies from "./components/TaskDependencies";

type Task = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    username: string;
    department: string;
    departmentName: string;
  };
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    username: string;
    department: string;
    departmentName: string;
  };
  assignedDepartments: string[];
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestDate: string;
  dueDate?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type TaskComment = {
  id: string;
  taskId: string;
  text: string;
  authorId: string;
  author: string;
  timestamp: string;
};

type TaskAttachment = {
  id: string;
  taskId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
};

type User = {
  id: string;
  name: string;
  username: string;
  department: string;
  departmentName: string;
};

const getStatusIcon = (status: string) => {
  switch(status?.toUpperCase()) {
    case "COMPLETED":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "BLOCKED":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "IN_PROGRESS":
      return <Clock className="w-5 h-5 text-blue-500" />;
    case "TODO":
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch(status?.toUpperCase()) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "BLOCKED":
      return "bg-red-100 text-red-800 border-red-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "TODO":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityColor = (priority: string) => {
  switch(priority?.toUpperCase()) {
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const user = session?.user;
  
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Sub-task state
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [showCreateSubtask, setShowCreateSubtask] = useState(false);
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: ''
  });

  const taskId = params.id as string;

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const taskData = await res.json();
        setTask(taskData);
      } else {
        console.error('Error fetching task:', res.status);
        setTask(null);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      setTask(null);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      const data = await res.json();
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchSubtasks = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`);
      const data = await res.json();
      setSubtasks(data);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (taskId) {
      Promise.all([fetchTask(), fetchComments(), fetchAttachments(), fetchSubtasks(), fetchUsers()]).finally(() => {
        setLoading(false);
      });
    }
  }, [taskId]);

  // Check for success message from edit page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('updated') === 'true') {
      setShowSuccessMessage(true);
      // Remove the parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, []);

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!task) return;

    try {
      setUpdatingStatus(true);
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: task.id, 
          status: newStatus
        }),
      });

      if (res.ok) {
        await fetchTask();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const errorData = await res.json();
        if (errorData.error === "Cannot complete task with incomplete sub-tasks") {
          alert(`Cannot complete task. Please complete the following sub-tasks first:\n${errorData.incompleteSubtasks.map((st: any) => `- ${st.title}`).join('\n')}`);
        } else {
          alert(errorData.error || "Failed to update task status");
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });
      
      if (res.ok) {
        setNewComment("");
        await fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`/api/tasks/${taskId}/attachments/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        await fetchAttachments();
      } else {
        const errorData = await res.json();
        console.error('Upload failed:', errorData.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskForm.title.trim()) return;
    
    setCreatingSubtask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subtaskForm.title,
          description: subtaskForm.description,
          parentTaskId: taskId,
          assigneeId: subtaskForm.assigneeId || null,
          priority: subtaskForm.priority,
          dueDate: subtaskForm.dueDate || null,
          status: 'TODO'
        }),
      });
      
      if (res.ok) {
        setSubtaskForm({
          title: '',
          description: '',
          assigneeId: '',
          priority: 'MEDIUM',
          dueDate: ''
        });
        setShowCreateSubtask(false);
        await fetchSubtasks();
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;

    if (confirm('Are you sure you want to delete this attachment?')) {
      try {
        const res = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          await fetchAttachments();
        } else {
          const errorData = await res.json();
          console.error('Delete failed:', errorData.error);
        }
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).getTime() !== 0;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h1>
          <p className="text-gray-600">The task you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const canEdit = user?.id === task.ownerId || user?.id === task.assigneeId || task.assignedDepartments.includes(user?.department || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-3">
          <nav className="flex items-center space-x-2 text-xs text-gray-500">
            <a href="/lvm/tasks" className="hover:text-gray-700 hover:underline cursor-pointer">
              Tasks
            </a>
            <span>/</span>
            <span className="text-gray-900 font-medium">{task.title}</span>
          </nav>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <p className="text-green-800 text-sm font-medium">Task updated successfully!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <p className="mt-1 text-xs text-gray-600">
                Created by {task.owner?.name || task.owner?.username || 'Unknown'} on {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canEdit && (
                <a
                  href={`/lvm/tasks/${task.id}/edit`}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  <Edit className="w-3 h-3 mr-1.5" />
                  Edit Task
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Task Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Task Details</h2>
              </div>
              <div className="p-4">
                {task.description && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-gray-700 mb-1">Description</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1">Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1">Priority</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1">Request Date</h3>
                    <p className="text-sm text-gray-900">{new Date(task.requestDate).toLocaleDateString()}</p>
                  </div>

                  {task.dueDate && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-1">Due Date</h3>
                      <p className={`text-sm ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate) && ' (Overdue)'}
                      </p>
                    </div>
                  )}

                  {task.project?.name && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-1">Linked Project</h3>
                      <a 
                        href={`/lvm/projects/${task.project.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {task.project.name}
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Management */}
                {canEdit && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-medium text-gray-700 mb-2">Update Status</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].map((status) => {
                        const hasIncompleteSubtasks = subtasks.some(st => st.status !== 'COMPLETED');
                        const isCompletedButton = status === 'COMPLETED';
                        const isDisabled = updatingStatus || 
                          task.status === status || 
                          (isCompletedButton && hasIncompleteSubtasks && subtasks.length > 0);
                        
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status as Task['status'])}
                            disabled={isDisabled}
                            className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                              task.status === status
                                ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-default'
                                : isDisabled
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                            }`}
                            title={isCompletedButton && hasIncompleteSubtasks && subtasks.length > 0 
                              ? "Complete all sub-tasks first" 
                              : undefined}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                    {subtasks.some(st => st.status !== 'COMPLETED') && subtasks.length > 0 && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ Complete all sub-tasks before marking this task as completed
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-tasks Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Sub-tasks</h2>
                  {canEdit && (
                    <button
                      onClick={() => setShowCreateSubtask(!showCreateSubtask)}
                      className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Sub-task
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {/* Create Sub-task Form */}
                {showCreateSubtask && canEdit && (
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <form onSubmit={handleCreateSubtask} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Sub-task Title *
                        </label>
                        <input
                          type="text"
                          value={subtaskForm.title}
                          onChange={(e) => setSubtaskForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          placeholder="Enter sub-task title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={subtaskForm.description}
                          onChange={(e) => setSubtaskForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs resize-none"
                          placeholder="Enter sub-task description"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={subtaskForm.priority}
                            onChange={(e) => setSubtaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Assignee
                          </label>
                          <select
                            value={subtaskForm.assigneeId}
                            onChange={(e) => setSubtaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.departmentName})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={subtaskForm.dueDate}
                            onChange={(e) => setSubtaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={!subtaskForm.title || creatingSubtask}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                        >
                          {creatingSubtask ? "Creating..." : "Create Sub-task"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateSubtask(false)}
                          className="px-3 py-1 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sub-tasks List */}
                {subtasks.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-3">No sub-tasks</p>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(subtask.status)}
                          <div>
                            <Link
                              href={`/lvm/tasks/${subtask.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {subtask.title}
                            </Link>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {subtask.assignee?.name || 'Unassigned'}
                              </span>
                              <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(subtask.priority)}`}>
                                {subtask.priority}
                              </span>
                              {subtask.dueDate && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(subtask.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/lvm/tasks/${subtask.id}`}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="View sub-task"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Task Dependencies */}
            <TaskDependencies taskId={taskId} canEdit={canEdit} />

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Comments & Updates</h2>
              </div>
              
              <div className="p-4">
                <form onSubmit={handleAddComment} className="mb-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Add Comment
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Add a comment or update..."
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="comment"
                            checked={true}
                            readOnly
                            className="mr-1.5"
                          />
                          <span className="text-xs text-gray-700">Comment</span>
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                      >
                        {submittingComment ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">No comments yet. Be the first to comment!</p>
                  ) : (
                    [...comments]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((comment) => (
                        <div key={comment.id} className="border border-gray-200 rounded-lg p-2">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {comment.author.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-900">{comment.author}</p>
                                <p className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Assignment Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Assignment</h2>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-medium text-gray-700 mb-1">Owner</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {(task.owner?.name || task.owner?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{task.owner?.name || task.owner?.username}</p>
                      <p className="text-xs text-gray-500">{task.owner?.department}</p>
                    </div>
                  </div>
                </div>

                {task.assignee && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1">Assignee</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-600">
                          {(task.assignee.name || task.assignee.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{task.assignee.name || task.assignee.username}</p>
                        <p className="text-xs text-gray-500">{task.assignee.department}</p>
                      </div>
                    </div>
                  </div>
                )}

                {task.assignedDepartments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700 mb-1">Assigned Departments</h3>
                    <div className="flex flex-wrap gap-1">
                      {task.assignedDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Attachments</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Paperclip className="w-3 h-3" />
                    <span>{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {/* Upload Section */}
                {canEdit && (
                  <div className="mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <form onSubmit={handleFileUpload} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Upload File
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                      >
                        {uploading ? "Uploading..." : "Upload Attachment"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Attachments List */}
                {attachments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-3">No attachments</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3 h-3 text-gray-400" />
                          <div>
                            <p className="text-xs font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => window.open(attachment.filePath, '_blank')}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 