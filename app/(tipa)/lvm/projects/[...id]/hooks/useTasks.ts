import { useState, useEffect, useCallback } from 'react';
import { Task, TaskForm, User } from '../types/project';

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
    estimatedHours: "",
    tags: [],
  });

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [projectId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        // Handle paginated response from users API
        const userList = data.users || data;
        console.log("Fetched users for task assignment:", userList);
        setUsers(userList);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      return { success: false, message: "Task title is required" };
    }

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
        setTasks(prev => [...prev, newTask]);
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
        return { success: true, message: "Task created successfully!" };
      } else {
        const error = await res.json();
        return { success: false, message: `Failed to create task: ${error.error}` };
      }
    } catch (error) {
      console.error("Error creating task:", error);
      return { success: false, message: "Failed to create task" };
    } finally {
      setCreatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
        return { success: true, message: "Task status updated!" };
      } else {
        return { success: false, message: "Failed to update task status" };
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      return { success: false, message: "Failed to update task status" };
    }
  };

  const resetTaskForm = () => {
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
  };

  return {
    tasks,
    users,
    showCreateTask,
    setShowCreateTask,
    creatingTask,
    taskForm,
    setTaskForm,
    createTask,
    updateTaskStatus,
    resetTaskForm,
    fetchTasks,
    fetchUsers,
  };
} 