"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  Paperclip,
  Edit,
  Trash2,
  Download,
  Send
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner_name?: string;
  owner_username?: string;
  owner_department?: string;
  assigneeId?: string;
  assignee_name?: string;
  assignee_username?: string;
  assignee_department?: string;
  assignedDepartments: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestDate: string;
  dueDate?: string;
  finishedDate?: string;
  projectId?: string;
  project_name?: string;
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

const getStatusIcon = (status: string) => {
  switch(status?.toUpperCase()) {
    case "COMPLETED":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "CANCELLED":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "OVERDUE":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "IN_PROGRESS":
      return <Clock className="w-5 h-5 text-blue-500" />;
    case "REVIEW":
      return <FileText className="w-5 h-5 text-orange-500" />;
    case "PENDING":
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch(status?.toUpperCase()) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    case "OVERDUE":
      return "bg-red-100 text-red-800 border-red-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "REVIEW":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "PENDING":
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

  const taskId = params.id as string;

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks`);
      const tasks = await res.json();
      const foundTask = tasks.find((t: Task) => t.id === taskId);
      setTask(foundTask || null);
    } catch (error) {
      console.error('Error fetching task:', error);
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

  useEffect(() => {
    if (taskId) {
      Promise.all([fetchTask(), fetchComments(), fetchAttachments()]).finally(() => {
        setLoading(false);
      });
    }
  }, [taskId]);

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!task) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: task.id, 
          status: newStatus,
          ...(newStatus === 'COMPLETED' && !task.finishedDate ? { finishedDate: new Date().toISOString() } : {})
        }),
      });
      
      if (res.ok) {
        await fetchTask();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <p className="mt-2 text-sm text-gray-600">
                Created by {task.owner_name || task.owner_username} on {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canEdit && (
                <a
                  href={`/lvm/tasks/${task.id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
              </div>
              <div className="p-6">
                {task.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Priority</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Request Date</h3>
                    <p className="text-gray-900">{new Date(task.requestDate).toLocaleDateString()}</p>
                  </div>

                  {task.dueDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Due Date</h3>
                      <p className={`${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate) && ' (Overdue)'}
                      </p>
                    </div>
                  )}

                  {task.finishedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Completed Date</h3>
                      <p className="text-gray-900">{new Date(task.finishedDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  {task.project_name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Linked Project</h3>
                      <p className="text-blue-600 hover:text-blue-800 cursor-pointer">
                        {task.project_name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Management */}
                {canEdit && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status as Task['status'])}
                          disabled={updatingStatus || task.status === status}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                            task.status === status
                              ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-default'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingStatus ? 'Updating...' : status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex gap-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      rows={3}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {comment.author.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                              <p className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Assignment</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Owner</h3>
                                       <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                         <span className="text-sm font-medium text-blue-600">
                           {(task.owner_name || task.owner_username || 'U').charAt(0).toUpperCase()}
                         </span>
                       </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.owner_name || task.owner_username}</p>
                      <p className="text-xs text-gray-500">{task.owner_department}</p>
                    </div>
                  </div>
                </div>

                {task.assignee_name && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">
                          {task.assignee_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.assignee_name}</p>
                        <p className="text-xs text-gray-500">{task.assignee_department}</p>
                      </div>
                    </div>
                  </div>
                )}

                {task.assignedDepartments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Departments</h3>
                    <div className="flex flex-wrap gap-1">
                      {task.assignedDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Paperclip className="w-4 h-4" />
                    <span>{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {attachments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No attachments</p>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(attachment.filePath, '_blank')}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
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