import { useState, useEffect } from 'react';
import { Comment } from '../types/project';

export function useComments(projectId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComments = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/comments?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !projectId) return;

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          projectId,
        }),
      });

      if (res.ok) {
        const newCommentData = await res.json();
        setComments(prev => [...prev, newCommentData]);
        setNewComment("");
        return { success: true, message: "Comment submitted successfully!" };
      } else {
        return { success: false, message: "Failed to submit comment" };
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      return { success: false, message: "Failed to submit comment" };
    } finally {
      setSubmittingComment(false);
    }
  };

  return {
    comments,
    newComment,
    setNewComment,
    submittingComment,
    submitComment,
    fetchComments,
  };
} 