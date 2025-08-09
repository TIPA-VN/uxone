"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Menu } from "lucide-react";
import { Task, User } from "../types/project";
import { canCreateTasks } from "@/lib/rbac";
import { useClickOutside } from "@/hooks/useClickOutside";

interface TasksTabProps {
  projectId: string;
  tasks: Task[];
  users: User[];
  onTaskCreated: (task: Task) => void;
  onTaskStatusUpdated: (taskId: string, newStatus: string) => void;
  user: {
    id: string;
    role?: string;
    department?: string;
  } | undefined;
  projectOwnerId: string;
}

export function TasksTab({ 
  projectId, 
  tasks, 
  users, 
  onTaskCreated, 
  onTaskStatusUpdated,
  user,
  projectOwnerId
}: TasksTabProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
    estimatedHours: "",
    tags: [] as string[],
  });
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Click outside handling for dropdowns
  const dropdownRef = useClickOutside(dropdownOpen !== null, () => setDropdownOpen(null));
  
  // Click outside handling for create task form
  const createTaskFormRef = useClickOutside(showCreateTask, () => setShowCreateTask(false));

  // Keyboard escape handler for dropdowns
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen]);

  // Permission checks using RBAC functions
  const canCreate = user && canCreateTasks(
    user.role || '',
    user.id,
    projectOwnerId
  );

  // Filter users to only show assignable users for assignment
  const assignableUsers = users.filter(u => {
    // Show users with roles that can be assigned tasks
    const assignableRoles = ['MANAGER', 'SENIOR_MANAGER', 'DEVELOPER', 'SUPPORT', 'ADMIN'];
    const hasValidRole = assignableRoles.includes(u.role?.toUpperCase() || '');
    const isActive = u.isActive !== false;
    
    return hasValidRole && isActive;
  });

  // Temporary: show all users for debugging
  const allUsers = users.filter(u => u.isActive !== false);

  // Fallback: if no assignable users found, show all active users
  const displayUsers = assignableUsers.length > 0 ? assignableUsers : allUsers;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          projectId,
          estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : null,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        onTaskCreated(newTask);
        setTaskForm({
          title: "",
          description: "",
          status: "TODO",
          priority: "MEDIUM",
          assigneeId: "",
          dueDate: "",
          estimatedHours: "",
          tags: [],
        });
        setShowCreateTask(false);
      } else {
        const error = await res.json();
        alert(`Failed to create task: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onTaskStatusUpdated(taskId, newStatus);
      } else {
        const errorData = await res.json();
        if (errorData.error === "Cannot complete task with incomplete sub-tasks") {
          alert(`Cannot complete task. Please complete the following sub-tasks first:\n${errorData.incompleteSubtasks.map((st: { title: string }) => `- ${st.title}`).join('\n')}`);
        } else {
          alert(errorData.error || "Failed to update task status");
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  const toggleDropdown = (taskId: string) => {
    setDropdownOpen(dropdownOpen === taskId ? null : taskId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          {/* Only show create task button if user has permission */}
          {canCreate && (
            <button
              onClick={() => setShowCreateTask(!showCreateTask)}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors cursor-pointer"
            >
              {showCreateTask ? "Cancel" : "New Task"}
            </button>
          )}
        </div>

        {/* Task Creation Form */}
        {showCreateTask && canCreate && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200" ref={createTaskFormRef}>
            <h4 className="font-medium text-purple-900 mb-3">Create New Task</h4>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Select assignee</option>
                    {/* Show assignable users for assignment */}
                    {displayUsers.length > 0 ? (
                      displayUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.username} ({user.department}) - {user.role || 'No Role'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {users.length === 0 ? "No users available" : "No assignable users found"}
                      </option>
                    )}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows={2}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask || !taskForm.title.trim()}
                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  {creatingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-gray-100 rounded p-1 overflow-x-auto pb-16">
          {tasks.length === 0 ? (
            <div className="text-gray-400 text-xs">No tasks found for this project.</div>
          ) : (
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <th className="py-2 px-3 text-left font-medium text-xs w-1/3">Title</th>
                  <th className="py-2 px-3 text-left font-medium text-xs w-1/3">Status</th>
                  <th className="py-2 px-3 text-left font-medium text-xs w-1/3">Due Date</th>
                  <th className="py-2 px-3 text-center font-medium text-xs w-1/10 min-w-[60px]">Option</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={task.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-0.5 px-3 break-words w-1/3">{task.title}</td>
                    <td className="py-0.5 px-3 w-1/3">
                      <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${
                        task.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                        task.status === "TODO" ? "bg-gray-100 text-gray-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-0.5 px-3 w-1/3">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-gray-400 italic">No due date</span>}
                    </td>
                    <td className="py-0.5 px-3 w-1/10 min-w-[60px]">
                      <div className="relative dropdown-container flex justify-center" ref={dropdownRef}>
                        <button
                          onClick={() => toggleDropdown(task.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Menu className="w-4 h-4 text-gray-600" />
                        </button>
                        {dropdownOpen === task.id && (
                          <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, "COMPLETED")}
                              className="w-full px-2 py-1 text-left text-xs hover:bg-green-100 focus:bg-green-100 focus:outline-none focus:ring-1 focus:ring-green-500 flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
                              className="w-full px-2 py-1 text-left text-xs hover:bg-blue-100 focus:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center gap-1 transition-colors"
                            >
                              <Clock className="w-3 h-3 text-blue-600" />
                              In Progress
                            </button>
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, "TODO")}
                              className="w-full px-2 py-1 text-left text-xs hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500 flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3 h-3 text-gray-600" />
                              To Do
                            </button>
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
  );
} 