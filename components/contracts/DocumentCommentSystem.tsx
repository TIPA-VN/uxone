"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  User,
  Calendar,
  Flag,
  Tag,
  Reply,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface User {
  id: string;
  name?: string;
  username?: string;
  department?: string;
  role?: string;
}

interface DocumentComment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByUser?: User;
  parentId?: string;
  replies: DocumentComment[];
  selectionStart?: number;
  selectionEnd?: number;
  selectedText?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED' | 'DELETED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'LEGAL' | 'TECHNICAL' | 'COMMERCIAL' | 'COMPLIANCE' | 'CLARIFICATION' | 'SUGGESTION' | 'ISSUE';
}

interface DocumentCommentSystemProps {
  contractId: string;
  documentContent: string;
  user: User;
  isLegalReview?: boolean;
  readOnly?: boolean;
  onCommentAdded?: (comment: DocumentComment) => void;
  onCommentUpdated?: (comment: DocumentComment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300',
  NORMAL: 'bg-blue-100 text-blue-700 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  URGENT: 'bg-red-100 text-red-700 border-red-300'
};

const CATEGORY_COLORS = {
  GENERAL: 'bg-gray-100 text-gray-700',
  LEGAL: 'bg-purple-100 text-purple-700',
  TECHNICAL: 'bg-blue-100 text-blue-700',
  COMMERCIAL: 'bg-green-100 text-green-700',
  COMPLIANCE: 'bg-yellow-100 text-yellow-700',
  CLARIFICATION: 'bg-indigo-100 text-indigo-700',
  SUGGESTION: 'bg-pink-100 text-pink-700',
  ISSUE: 'bg-red-100 text-red-700'
};

export default function DocumentCommentSystem({
  contractId,
  documentContent,
  user,
  isLegalReview = false,
  readOnly = false,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}: DocumentCommentSystemProps) {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [commentPriority, setCommentPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [commentCategory, setCommentCategory] = useState<'GENERAL' | 'LEGAL' | 'TECHNICAL' | 'COMMERCIAL' | 'COMPLIANCE' | 'CLARIFICATION' | 'SUGGESTION' | 'ISSUE'>('GENERAL');
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentFormRef = useRef<HTMLDivElement>(null);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [contractId]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim();
        setSelectedText(selectedText);
        
        // Calculate approximate position in document
        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        setSelectionRange({ start: startOffset, end: endOffset });
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contractId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        setError('Failed to load comments');
      }
    } catch (error) {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyingTo,
          selectionStart: selectionRange?.start,
          selectionEnd: selectionRange?.end,
          selectedText: selectedText,
          priority: commentPriority,
          category: commentCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newCommentData = data.comment;
        
        if (replyingTo) {
          // Add reply to existing comment
          setComments(prev => prev.map(comment => 
            comment.id === replyingTo 
              ? { ...comment, replies: [...comment.replies, newCommentData] }
              : comment
          ));
        } else {
          // Add new top-level comment
          setComments(prev => [newCommentData, ...prev]);
        }

        onCommentAdded?.(newCommentData);
        setNewComment('');
        setSelectedText('');
        setSelectionRange(null);
        setReplyingTo(null);
        setShowCommentForm(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add comment');
      }
    } catch (error) {
      setError('Failed to add comment');
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComment = data.comment;
        
        // Update comment in state
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        ));
        
        onCommentUpdated?.(updatedComment);
        setEditingComment(null);
        setEditContent('');
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update comment');
      }
    } catch (error) {
      setError('Failed to update comment');
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: resolved })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComment = data.comment;
        
        // Update comment in state
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        ));
        
        onCommentUpdated?.(updatedComment);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update comment');
      }
    } catch (error) {
      setError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove comment from state
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        onCommentDeleted?.(commentId);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete comment');
      }
    } catch (error) {
      setError('Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="w-4 h-4" />;
      case 'HIGH': return <Flag className="w-4 h-4" />;
      case 'NORMAL': return <Clock className="w-4 h-4" />;
      case 'LOW': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const renderComment = (comment: DocumentComment, isReply = false) => {
    const isAuthor = comment.authorId === user.id;
    const isEditing = editingComment === comment.id;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mb-4'} p-4 bg-white border rounded-lg shadow-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm">{comment.author.name || comment.author.username}</span>
                <span className="text-xs text-gray-500">({comment.author.department})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs border ${PRIORITY_COLORS[comment.priority]}`}>
                <div className="flex items-center space-x-1">
                  {getPriorityIcon(comment.priority)}
                  <span>{comment.priority}</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${CATEGORY_COLORS[comment.category]}`}>
                <Tag className="w-3 h-3 inline mr-1" />
                {comment.category}
              </div>
              {comment.isResolved && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Resolved</span>
                </div>
              )}
            </div>

            {comment.selectedText && (
              <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="text-xs text-yellow-700 font-medium mb-1">Selected text:</div>
                <div className="text-sm text-yellow-800 italic">"{comment.selectedText}"</div>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateComment(comment.id, editContent)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</div>
            )}

            {comment.resolvedAt && comment.resolvedByUser && (
              <div className="mt-2 text-xs text-gray-500">
                Resolved by {comment.resolvedByUser.name || comment.resolvedByUser.username} on {formatDate(comment.resolvedAt)}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-4">
            {!isReply && !readOnly && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>
            )}
            
            {isAuthor && !readOnly && (
              <>
                <button
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            {!comment.isResolved && (
              <button
                onClick={() => handleResolveComment(comment.id, true)}
                className="p-1 text-gray-400 hover:text-green-600"
                title="Mark as resolved"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}

        {/* Reply form */}
        {replyingTo === comment.id && !readOnly && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        )}
      </div>
    );
  };

  const filteredComments = showResolved 
    ? comments 
    : comments.filter(comment => !comment.isResolved);

  const activeCommentsCount = comments.filter(comment => !comment.isResolved).length;
  const resolvedCommentsCount = comments.filter(comment => comment.isResolved).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Document Comments</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {activeCommentsCount} active
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {resolvedCommentsCount} resolved
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {showResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showResolved ? 'Hide' : 'Show'} resolved</span>
            </button>
            {!readOnly && (
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Comment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comment form */}
      {showCommentForm && !readOnly && (
        <div ref={commentFormRef} className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {selectedText && (
              <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="text-xs text-yellow-700 font-medium mb-1">Selected text:</div>
                <div className="text-sm text-yellow-800 italic">"{selectedText}"</div>
              </div>
            )}
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Priority:</label>
                <select
                  value={commentPriority}
                  onChange={(e) => setCommentPriority(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={commentCategory}
                  onChange={(e) => setCommentCategory(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="LEGAL">Legal</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="CLARIFICATION">Clarification</option>
                  <option value="SUGGESTION">Suggestion</option>
                  <option value="ISSUE">Issue</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment('');
                  setSelectedText('');
                  setSelectionRange(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Add Comment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet. Be the first to add a comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}
