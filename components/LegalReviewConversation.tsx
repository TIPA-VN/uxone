'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Scale,
  Reply
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    department: string;
    role?: string;
  };
  createdAt: string;
  isResolved: boolean;
  priority: string;
  category: string;
  parentId?: string;
  replies?: Comment[];
  legalReviewRequest?: {
    id: string;
    status: string;
    requestedByUser: {
      id: string;
      name: string;
      username: string;
      department: string;
    };
    assignedToUser?: {
      id: string;
      name: string;
      username: string;
      department: string;
    };
  };
}

interface LegalReviewRequest {
  id: string;
  status: string;
  requestedBy: string;
  assignedTo?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  initialComment?: string;
  finalComment?: string;
  requestedByUser: {
    id: string;
    name: string;
    username: string;
    department: string;
  };
  assignedToUser?: {
    id: string;
    name: string;
    username: string;
    department: string;
  };
  comments: Comment[];
}

interface LegalReviewConversationProps {
  contractId: string;
  legalReviewRequest?: LegalReviewRequest;
  currentUser: {
    id: string;
    name: string;
    username: string;
    department: string;
    role?: string;
  };
  onCommentAdded: () => void;
  onCommentResolved: (commentId: string) => void;
}

export default function LegalReviewConversation({
  contractId,
  legalReviewRequest,
  currentUser,
  onCommentAdded,
  onCommentResolved
}: LegalReviewConversationProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      'IN_REVIEW': { color: 'bg-blue-100 text-blue-800', label: 'In Review', icon: Scale },
      'CHANGES_REQUESTED': { color: 'bg-orange-100 text-orange-800', label: 'Changes Requested', icon: AlertCircle },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: AlertCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = {
      'LOW': 'text-gray-600 bg-gray-100 border-gray-300',
      'NORMAL': 'text-blue-600 bg-blue-100 border-blue-300',
      'HIGH': 'text-orange-600 bg-orange-100 border-orange-300',
      'URGENT': 'text-red-600 bg-red-100 border-red-300'
    };
    
    return priorityConfig[priority as keyof typeof priorityConfig] || 'text-gray-600 bg-gray-100 border-gray-300';
  };

  const canReply = () => {
    if (!legalReviewRequest) return false;
    
    // Legal users can always reply
    if (currentUser.department?.toUpperCase() === 'LEGAL' || currentUser.role === 'ADMIN') {
      return true;
    }
    
    // Contract owner/editor can reply if review is in progress or changes requested
    if (['IN_REVIEW', 'CHANGES_REQUESTED'].includes(legalReviewRequest.status)) {
      return true;
    }
    
    return false;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyingTo,
          category: 'LEGAL',
          priority: 'NORMAL',
          legalReviewRequestId: legalReviewRequest?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      setNewComment('');
      setReplyingTo(null);
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isResolved: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve comment');
      }

      onCommentResolved(commentId);
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment. Please try again.');
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className={`border rounded-lg p-4 ${comment.isResolved ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={`/api/avatar/${comment.author.username}`} />
              <AvatarFallback>
                {comment.author.name?.charAt(0) || comment.author.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author.name || comment.author.username}</span>
                <Badge variant="outline" className="text-xs">
                  {comment.author.department}
                </Badge>
                <Badge className={`text-xs ${getPriorityColor(comment.priority)}`}>
                  {comment.priority}
                </Badge>
                {comment.isResolved && (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
          {comment.content}
        </div>
        
        <div className="flex items-center gap-2">
          {!comment.isResolved && canReply() && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          
          {!comment.isResolved && currentUser.department?.toUpperCase() === 'LEGAL' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveComment(comment.id)}
              className="text-green-600 border-green-600 hover:bg-green-50 text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Resolve
            </Button>
          )}
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-3 pt-3 border-t">
            <Textarea
              placeholder="Write a reply..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                <Send className="w-3 h-3 mr-1" />
                {isSubmitting ? 'Sending...' : 'Send Reply'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  if (!legalReviewRequest) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No legal review request found for this contract.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Legal Review Conversation
          {getStatusBadge(legalReviewRequest.status)}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>Requested by: {legalReviewRequest.requestedByUser.name} ({legalReviewRequest.requestedByUser.department})</p>
          {legalReviewRequest.assignedToUser && (
            <p>Assigned to: {legalReviewRequest.assignedToUser.name} ({legalReviewRequest.assignedToUser.department})</p>
          )}
          <p>Created: {formatDistanceToNow(new Date(legalReviewRequest.createdAt), { addSuffix: true })}</p>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Initial comment */}
        {legalReviewRequest.initialComment && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-900">Initial Request</span>
            </div>
            <p className="text-sm text-blue-800">{legalReviewRequest.initialComment}</p>
          </div>
        )}

        {/* Final comment */}
        {legalReviewRequest.finalComment && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-sm text-green-900">Final Review</span>
            </div>
            <p className="text-sm text-green-800">{legalReviewRequest.finalComment}</p>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-4">
          {legalReviewRequest.comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No comments yet. Start the conversation below.
            </div>
          ) : (
            legalReviewRequest.comments.map((comment) => renderComment(comment))
          )}
        </div>

        {/* New comment form */}
        {canReply() && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-sm">Add a comment</span>
            </div>
            <Textarea
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-3"
              rows={4}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Comment'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
