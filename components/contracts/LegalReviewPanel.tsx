"use client";

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  User,
  Calendar,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  FileText,
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

interface LegalReviewStatus {
  contractStatus: string;
  currentApprovalLevel: number;
  totalApprovalLevels: number;
  isInReview: boolean;
  legalComments: {
    total: number;
    resolved: number;
    unresolved: number;
  };
  comments: any[];
}

interface LegalReviewPanelProps {
  contractId: string;
  user: User;
  onReviewStatusChange?: (status: LegalReviewStatus) => void;
}

export default function LegalReviewPanel({
  contractId,
  user,
  onReviewStatusChange
}: LegalReviewPanelProps) {
  const [reviewStatus, setReviewStatus] = useState<LegalReviewStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadReviewStatus();
  }, [contractId]);

  const loadReviewStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contractId}/legal-review`);
      if (response.ok) {
        const data = await response.json();
        setReviewStatus(data.reviewStatus);
        onReviewStatusChange?.(data.reviewStatus);
      } else {
        setError('Failed to load review status');
      }
    } catch (error) {
      setError('Failed to load review status');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: string) => {
    if (!reviewComment.trim() && action !== 'COMPLETE_REVIEW') {
      setError('Please provide a comment for this action');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/contracts/${contractId}/legal-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comment: reviewComment.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setReviewComment('');
        setShowReviewForm(false);
        await loadReviewStatus(); // Refresh status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process review action');
      }
    } catch (error) {
      setError('Failed to process review action');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SIGNED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'REVIEW': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'SIGNED': return <Scale className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!reviewStatus) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Failed to load review status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Scale className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Legal Review Status</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reviewStatus.contractStatus)}`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(reviewStatus.contractStatus)}
              <span>{reviewStatus.contractStatus}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Legal Comments</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{reviewStatus.legalComments.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Resolved:</span>
                <span className="font-medium text-green-600">{reviewStatus.legalComments.resolved}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unresolved:</span>
                <span className="font-medium text-red-600">{reviewStatus.legalComments.unresolved}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">Approval Progress</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Level:</span>
                <span className="font-medium">{reviewStatus.currentApprovalLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Levels:</span>
                <span className="font-medium">{reviewStatus.totalApprovalLevels}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(reviewStatus.currentApprovalLevel / reviewStatus.totalApprovalLevels) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Reviewer</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                {user.name || user.username}
              </div>
              <div className="text-xs text-gray-500">
                {user.department} • {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {reviewStatus.contractStatus === 'DRAFT' && (
            <button
              onClick={() => setShowReviewForm(true)}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>Start Legal Review</span>
            </button>
          )}

          {reviewStatus.contractStatus === 'REVIEW' && (
            <>
              <button
                onClick={() => setShowReviewForm(true)}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Review</span>
              </button>
              <button
                onClick={() => setShowReviewForm(true)}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Request Changes</span>
              </button>
            </>
          )}

          <button
            onClick={loadReviewStatus}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Legal Review Action</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Required)
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter your review comment..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                {reviewStatus.contractStatus === 'DRAFT' && (
                  <button
                    onClick={() => handleReviewAction('START_REVIEW')}
                    disabled={actionLoading || !reviewComment.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Review</span>
                  </button>
                )}
                {reviewStatus.contractStatus === 'REVIEW' && (
                  <>
                    <button
                      onClick={() => handleReviewAction('COMPLETE_REVIEW')}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Review</span>
                    </button>
                    <button
                      onClick={() => handleReviewAction('REQUEST_CHANGES')}
                      disabled={actionLoading || !reviewComment.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Changes</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Legal Comments */}
      {reviewStatus.comments && reviewStatus.comments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Legal Comments</h4>
          <div className="space-y-3">
            {reviewStatus.comments.slice(0, 5).map((comment: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{comment.author.name || comment.author.username}</span>
                    <span className="text-xs text-gray-500">({comment.author.department})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    {comment.isResolved ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
