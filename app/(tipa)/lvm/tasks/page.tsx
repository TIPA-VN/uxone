"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Calendar, Users, AlertCircle, Menu } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DataTable } from "@/components/ui/DataTable";
import { Task, User } from "@/types";
import { APP_CONFIG } from "@/config/app";
import { isOverdue, formatDateString } from "@/lib/utils";

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
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { 
    tasks, 
    loading, 
    error, 
    createTask 
  } = useTasks();

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatus(null);
    
    const success = await createTask({
      title,
      description,
      assigneeId: assigneeId || undefined,
      assignedDepartments,
      priority,
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
    });
    
    if (success) {
      setStatus("Task created successfully!");
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setAssignedDepartments([]);
      setPriority('MEDIUM');
      setDueDate("");
      setProjectId("");
      setShowCreateForm(false);
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
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  if (openMenuId) {
    document.addEventListener('click', handleClickOutside);
    setTimeout(() => document.removeEventListener('click', handleClickOutside), 0);
  }

  const taskColumns = [
    {
      key: "task",
      header: "Task",
      render: (task: Task) => (
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {task.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium text-gray-900">{task.title}</div>
            {task.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {task.description}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (task: Task) => (
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {task.assignee?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="ml-2">
            <div className="text-sm text-gray-900">{task.assignee?.name || 'Unassigned'}</div>
            <div className="text-xs text-gray-500">{task.assignee?.username || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: "project",
      header: "Project",
      render: (task: Task) => (
        <div className="text-sm text-gray-900">
          {task.project?.name || 'No Project'}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (task: Task) => (
        <StatusBadge status={task.status} size="sm" />
      )
    },
    {
      key: "priority",
      header: "Priority",
      render: (task: Task) => (
        <PriorityBadge priority={task.priority} size="sm" />
      )
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (task: Task) => (
        <div className="text-sm text-gray-900">
          {task.dueDate ? (
            <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''}>
              {formatDateString(task.dueDate)}
            </span>
          ) : (
            'No due date'
          )}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (task: Task) => (
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
              className="absolute right-0 top-full mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
              onClick={handleMenuClick}
            >
              <a
                href={`/lvm/tasks/${task.id}`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                View
              </a>
              <a
                href={`/lvm/tasks/${task.id}/edit`}
                className="block px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer text-left"
              >
                Edit
              </a>
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
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and track task assignments across the organization
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
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select assignee</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Assigned Departments
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {APP_CONFIG.departments.map(d => (
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

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <DataTable
            data={tasks}
            columns={taskColumns}
            loading={loading}
            emptyMessage="No tasks available"
          />
        </div>
      </div>
    </div>
  );
} 