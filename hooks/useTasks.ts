import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Task, TaskComment, TaskAttachment, TaskSubtask } from '@/types';

export const useTasks = () => {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    assigneeId?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    projectId?: string;
  }) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create task');
      }
      
      await fetchTasks(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return false;
    }
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: [taskId],
          updates: { status }
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update task status');
      }
      
      await fetchTasks(); // Refresh the list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status');
      return false;
    }
  }, [fetchTasks]);

  const getTaskById = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch task');
      }
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
      return null;
    }
  }, []);

  const getMyTasks = useCallback(() => {
    return tasks.filter(t => t.assigneeId === session?.user?.id);
  }, [tasks, session?.user?.id]);

  const getTasksByProject = useCallback((projectId: string) => {
    return tasks.filter(t => t.projectId === projectId);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTaskStatus,
    getTaskById,
    getMyTasks,
    getTasksByProject,
    getTasksByStatus,
  };
};

export const useTaskDetails = (taskId: string) => {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [taskRes, commentsRes, attachmentsRes, subtasksRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/tasks/${taskId}/comments`),
        fetch(`/api/tasks/${taskId}/attachments`),
        fetch(`/api/tasks/${taskId}/subtasks`)
      ]);

      const [taskData, commentsData, attachmentsData, subtasksData] = await Promise.all([
        taskRes.json(),
        commentsRes.json(),
        attachmentsRes.json(),
        subtasksRes.json()
      ]);

      setTask(taskData);
      setComments(commentsData);
      setAttachments(attachmentsData);
      setSubtasks(subtasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const addComment = useCallback(async (text: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add comment');
      }
      
      await fetchTaskDetails(); // Refresh comments
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return false;
    }
  }, [taskId, fetchTaskDetails]);

  const uploadAttachment = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`/api/tasks/${taskId}/attachments/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload attachment');
      }
      
      await fetchTaskDetails(); // Refresh attachments
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment');
      return false;
    }
  }, [taskId, fetchTaskDetails]);

  const createSubtask = useCallback(async (subtaskData: {
    title: string;
    description?: string;
    assigneeId?: string;
  }) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subtaskData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create subtask');
      }
      
      await fetchTaskDetails(); // Refresh subtasks
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subtask');
      return false;
    }
  }, [taskId, fetchTaskDetails]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  return {
    task,
    comments,
    attachments,
    subtasks,
    loading,
    error,
    addComment,
    uploadAttachment,
    createSubtask,
    fetchTaskDetails,
  };
}; 