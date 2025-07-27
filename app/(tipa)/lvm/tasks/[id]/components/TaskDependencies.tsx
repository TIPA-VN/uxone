"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Link, 
  Clock, 
  AlertTriangle, 
  Plus, 
  X, 
  CheckCircle,
  User,
  Calendar
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    name: string;
    username: string;
    department: string;
  };
  dueDate?: string;
};

type Dependency = {
  id: string;
  blockingTask: Task;
  createdAt: string;
};

type BlockingTask = {
  id: string;
  dependentTask: Task;
  createdAt: string;
};

type TaskDependenciesData = {
  dependencies: Dependency[];
  blockingTasks: BlockingTask[];
};

interface TaskDependenciesProps {
  taskId: string;
  canEdit: boolean;
}

export default function TaskDependencies({ taskId, canEdit }: TaskDependenciesProps) {
  const { data: session } = useSession();
  const [dependencies, setDependencies] = useState<TaskDependenciesData>({
    dependencies: [],
    blockingTasks: [],
  });
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchDependencies();
    fetchAvailableTasks();
  }, [taskId]);

  const fetchDependencies = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`);
      if (res.ok) {
        const data = await res.json();
        setDependencies(data);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const tasks = await res.json();
        // Filter out the current task and tasks that would create circular dependencies
        const filteredTasks = tasks.filter((task: Task) => 
          task.id !== taskId && 
          !dependencies.dependencies.some(dep => dep.blockingTask.id === task.id)
        );
        setAvailableTasks(filteredTasks);
      }
    } catch (error) {
      console.error("Error fetching available tasks:", error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedTaskId) return;

    try {
      setAdding(true);
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockingTaskId: selectedTaskId }),
      });

      if (res.ok) {
        await fetchDependencies();
        await fetchAvailableTasks();
        setShowAddDependency(false);
        setSelectedTaskId("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add dependency");
      }
    } catch (error) {
      console.error("Error adding dependency:", error);
      alert("Failed to add dependency");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveDependency = async (blockingTaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies?blockingTaskId=${blockingTaskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchDependencies();
        await fetchAvailableTasks();
      } else {
        alert("Failed to remove dependency");
      }
    } catch (error) {
      console.error("Error removing dependency:", error);
      alert("Failed to remove dependency");
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "BLOCKED":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Task Dependencies</h2>
          {canEdit && (
            <button
              onClick={() => setShowAddDependency(!showAddDependency)}
              className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Dependency
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {/* Add Dependency Form */}
        {showAddDependency && canEdit && (
          <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <label className="block text-xs font-medium text-gray-700">
                Select blocking task:
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">Choose a task...</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.assignee?.name || 'Unassigned'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddDependency}
                disabled={!selectedTaskId || adding}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                {adding ? "Adding..." : "Add Dependency"}
              </button>
              <button
                onClick={() => {
                  setShowAddDependency(false);
                  setSelectedTaskId("");
                }}
                className="px-3 py-1 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dependencies List */}
        <div className="space-y-4">
          {/* Tasks this task depends on */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              This task depends on ({dependencies.dependencies.length}):
            </h3>
            {dependencies.dependencies.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No dependencies</p>
            ) : (
              <div className="space-y-2">
                {dependencies.dependencies.map((dependency) => (
                  <div key={dependency.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(dependency.blockingTask.status)}
                      <div>
                        <Link
                          href={`/lvm/tasks/${dependency.blockingTask.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {dependency.blockingTask.title}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {dependency.blockingTask.assignee?.name || 'Unassigned'}
                          </span>
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(dependency.blockingTask.priority)}`}>
                            {dependency.blockingTask.priority}
                          </span>
                          {dependency.blockingTask.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(dependency.blockingTask.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveDependency(dependency.blockingTask.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove dependency"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks that depend on this task */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Tasks that depend on this ({dependencies.blockingTasks.length}):
            </h3>
            {dependencies.blockingTasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tasks depend on this task</p>
            ) : (
              <div className="space-y-2">
                {dependencies.blockingTasks.map((blockingTask) => (
                  <div key={blockingTask.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(blockingTask.dependentTask.status)}
                      <div>
                        <Link
                          href={`/lvm/tasks/${blockingTask.dependentTask.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {blockingTask.dependentTask.title}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {blockingTask.dependentTask.assignee?.name || 'Unassigned'}
                          </span>
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(blockingTask.dependentTask.priority)}`}>
                            {blockingTask.dependentTask.priority}
                          </span>
                          {blockingTask.dependentTask.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(blockingTask.dependentTask.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 