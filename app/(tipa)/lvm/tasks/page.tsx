"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Menu, FileText, MessageSquare, Paperclip } from "lucide-react";

// Task type definition
type Task = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner_name?: string;
  owner_username?: string;
  assigneeId?: string;
  assignee_name?: string;
  assignee_username?: string;
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
    case "COMPLETED":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "CANCELLED":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "OVERDUE":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "IN_PROGRESS":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "REVIEW":
      return <FileText className="w-4 h-4 text-orange-500" />;
    case "PENDING":
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
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

export default function TasksPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
  };

  useEffect(() => { 
    fetchTasks(); 
    fetchUsers();
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatus(null);
    
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title, 
        description, 
        assigneeId: assigneeId || null,
        assignedDepartments, 
        priority, 
        dueDate: dueDate || null,
        projectId: projectId || null
      }),
    });
    
    if (res.ok) {
      setStatus("Task created successfully!");
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setAssignedDepartments([]);
      setPriority('MEDIUM');
      setDueDate("");
      setProjectId("");
      setShowCreateForm(false);
      fetchTasks();
    } else {
      setStatus("Failed to create task.");
    }
    setCreating(false);
  };

  const handleMenuToggle = (taskId: string) => {
    setOpenMenuId(openMenuId === taskId ? null : taskId);
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).getTime() !== 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and track task assignments across departments
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </button>
            </div>
          </div>
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in the details below to create a new task</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
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
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Individual
                  </label>
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select user (optional)</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.username} ({user.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Project
                  </label>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select project (optional)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assign to Departments
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DEPARTMENTS.map(d => (
                    <label key={d.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={d.value}
                        checked={assignedDepartments.includes(d.value)}
                        onChange={e => setAssignedDepartments(prev => e.target.checked ? [...prev, d.value] : prev.filter(x => x !== d.value))}
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
                  disabled={creating || !title}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Task"}
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

        {/* Tasks List - Two Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks I Own */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tasks I Own</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{tasks.filter(t => t.ownerId === user?.id).length} task{tasks.filter(t => t.ownerId === user?.id).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
              {tasks.filter(t => t.ownerId === user?.id).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No owned tasks</h3>
                  <p className="text-xs text-gray-600 mb-3">Create a task to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Task
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
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
                    {tasks.filter(t => t.ownerId === user?.id).map((task, index) => (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {task.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-500'}`}>
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(task.status)}
                            <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(task.id);
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                            >
                              <Menu className="w-3 h-3 text-gray-500" />
                            </button>
                            
                            {openMenuId === task.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-28 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20"
                                onClick={handleMenuClick}
                              >
                                <a
                                  href={`/lvm/tasks/${task.id}`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  View Details
                                </a>
                                <a
                                  href={`/lvm/tasks/${task.id}/edit`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  Edit Task
                                </a>
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

          {/* Tasks Assigned to Me */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tasks Assigned to Me</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{tasks.filter(t => t.assigneeId === user?.id || t.assignedDepartments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).length} task{tasks.filter(t => t.assigneeId === user?.id || t.assignedDepartments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
              {tasks.filter(t => t.assigneeId === user?.id || t.assignedDepartments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No assigned tasks</h3>
                  <p className="text-xs text-gray-600">You'll see tasks here when they're assigned to you</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
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
                    {tasks.filter(t => t.assigneeId === user?.id || t.assignedDepartments?.some(dept => dept.toLowerCase() === user?.department?.toLowerCase())).map((task, index) => (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-medium text-green-600">
                                  {task.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-500'}`}>
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(task.status)}
                            <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuToggle(task.id);
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                            >
                              <Menu className="w-3 h-3 text-gray-500" />
                            </button>
                            
                            {openMenuId === task.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-28 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20"
                                onClick={handleMenuClick}
                              >
                                <a
                                  href={`/lvm/tasks/${task.id}`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  View Details
                                </a>
                                <a
                                  href={`/lvm/tasks/${task.id}/edit`}
                                  className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
                                >
                                  Edit Task
                                </a>
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