"use client";

import React, { useState, useEffect, useRef } from 'react';
import './annotation-styles.css';
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
  EyeOff,
  Highlighter,
  Bookmark,
  FileText
} from 'lucide-react';

interface User {
  id: string;
  name?: string;
  username?: string;
  department?: string;
  role?: string;
}

interface DocumentAnnotation {
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
  replies: DocumentAnnotation[];
  selectionStart?: number;
  selectionEnd?: number;
  selectedText?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED' | 'DELETED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'LEGAL' | 'TECHNICAL' | 'COMMERCIAL' | 'COMPLIANCE' | 'CLARIFICATION' | 'SUGGESTION' | 'ISSUE';
}

interface AnnotatedDocumentViewerProps {
  contractId: string;
  documentContent: string;
  user: User;
  readOnly?: boolean;
  onAnnotationAdded?: (annotation: DocumentAnnotation) => void;
  onAnnotationUpdated?: (annotation: DocumentAnnotation) => void;
  onAnnotationDeleted?: (annotationId: string) => void;
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300',
  NORMAL: 'bg-blue-100 text-blue-700 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  URGENT: 'bg-red-100 text-red-700 border-red-300'
};

const CATEGORY_COLORS = {
  GENERAL: 'bg-gray-50 border-gray-200',
  LEGAL: 'bg-purple-50 border-purple-200',
  TECHNICAL: 'bg-blue-50 border-blue-200',
  COMMERCIAL: 'bg-green-50 border-green-200',
  COMPLIANCE: 'bg-yellow-50 border-yellow-200',
  CLARIFICATION: 'bg-indigo-50 border-indigo-200',
  SUGGESTION: 'bg-pink-50 border-pink-200',
  ISSUE: 'bg-red-50 border-red-200'
};

const CATEGORY_HIGHLIGHT_COLORS = {
  GENERAL: 'bg-gray-200',
  LEGAL: 'bg-purple-200',
  TECHNICAL: 'bg-blue-200',
  COMMERCIAL: 'bg-green-200',
  COMPLIANCE: 'bg-yellow-200',
  CLARIFICATION: 'bg-indigo-200',
  SUGGESTION: 'bg-pink-200',
  ISSUE: 'bg-red-200'
};

const CATEGORY_ICONS = {
  GENERAL: MessageSquare,
  LEGAL: Bookmark,
  TECHNICAL: Flag,
  COMMERCIAL: Tag,
  COMPLIANCE: CheckCircle,
  CLARIFICATION: AlertCircle,
  SUGGESTION: Plus,
  ISSUE: AlertCircle
};

export default function AnnotatedDocumentViewer({
  contractId,
  documentContent,
  user,
  readOnly = false,
  onAnnotationAdded,
  onAnnotationUpdated,
  onAnnotationDeleted
}: AnnotatedDocumentViewerProps) {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof CATEGORY_COLORS>('GENERAL');
  const [selectedPriority, setSelectedPriority] = useState<keyof typeof PRIORITY_COLORS>('NORMAL');
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);
  const annotationFormRef = useRef<HTMLDivElement>(null);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [contractId]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);
        
        setSelectedText(selectedText);
        setSelectionRange({
          start: range.startOffset,
          end: range.endOffset
        });
        
        if (!readOnly) {
          setShowAnnotationForm(true);
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [readOnly]);

  const loadAnnotations = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
      setError('Failed to load annotations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!newAnnotation.trim()) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newAnnotation.trim(),
          parentId: replyingTo,
          selectionStart: selectionRange?.start,
          selectionEnd: selectionRange?.end,
          selectedText: selectedText,
          priority: selectedPriority,
          category: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newAnnotationData = data.comment;
        
        if (replyingTo) {
          setAnnotations(prev => prev.map(annotation => 
            annotation.id === replyingTo 
              ? { ...annotation, replies: [...annotation.replies, newAnnotationData] }
              : annotation
          ));
        } else {
          setAnnotations(prev => [newAnnotationData, ...prev]);
        }

        onAnnotationAdded?.(newAnnotationData);
        setNewAnnotation('');
        setSelectedText('');
        setSelectionRange(null);
        setReplyingTo(null);
        setShowAnnotationForm(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add annotation');
      }
    } catch (error) {
      setError('Failed to add annotation');
    }
  };

  const handleUpdateAnnotation = async (annotationId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/comments/${annotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent.trim(),
          priority: selectedPriority,
          category: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedAnnotation = data.comment;
        
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === annotationId ? updatedAnnotation : annotation
        ));
        
        onAnnotationUpdated?.(updatedAnnotation);
        setEditingAnnotation(null);
        setEditContent('');
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update annotation');
      }
    } catch (error) {
      setError('Failed to update annotation');
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!confirm('Are you sure you want to delete this annotation?')) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/comments/${annotationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAnnotations(prev => prev.filter(annotation => annotation.id !== annotationId));
        onAnnotationDeleted?.(annotationId);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete annotation');
      }
    } catch (error) {
      setError('Failed to delete annotation');
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

  const getAnnotationIcon = (category: keyof typeof CATEGORY_COLORS) => {
    const IconComponent = CATEGORY_ICONS[category];
    return <IconComponent className="w-4 h-4" />;
  };

  // Create highlighted document content
  const createHighlightedContent = () => {
    if (!documentContent) return documentContent;

    let highlightedContent = documentContent;
    const activeAnnotations = annotations.filter(annotation => 
      !annotation.isResolved && annotation.selectedText && annotation.selectionStart !== undefined && annotation.selectionEnd !== undefined
    );

    // Sort annotations by position (descending) to avoid offset issues
    const sortedAnnotations = activeAnnotations.sort((a, b) => (b.selectionStart || 0) - (a.selectionStart || 0));

    sortedAnnotations.forEach(annotation => {
      if (annotation.selectedText && annotation.selectionStart !== undefined && annotation.selectionEnd !== undefined) {
        const start = annotation.selectionStart;
        const end = annotation.selectionEnd;
        const selectedText = annotation.selectedText;
        
        // Find the text in the document and replace with highlighted version
        const beforeText = highlightedContent.substring(0, start);
        const afterText = highlightedContent.substring(end);
        
        const highlightClass = CATEGORY_HIGHLIGHT_COLORS[annotation.category];
        const priorityClass = annotation.priority === 'URGENT' ? 'border-2 border-red-400' : '';
        
        highlightedContent = beforeText + 
          `<mark class="annotation-highlight ${highlightClass} ${priorityClass}" data-annotation-id="${annotation.id}" style="cursor: pointer; position: relative;">${selectedText}</mark>` + 
          afterText;
      }
    });

    return highlightedContent;
  };

  const renderAnnotation = (annotation: DocumentAnnotation, isReply = false) => {
    const isAuthor = annotation.authorId === user?.id;
    const CategoryIcon = CATEGORY_ICONS[annotation.category];
    
    return (
      <div
        key={annotation.id}
        className={`${isReply ? 'ml-6 mt-2' : 'mb-4'} p-3 rounded-lg border ${
          CATEGORY_COLORS[annotation.category]
        } ${annotation.isResolved ? 'opacity-60' : ''} ${
          selectedAnnotation === annotation.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onMouseEnter={() => setHoveredAnnotation(annotation.id)}
        onMouseLeave={() => setHoveredAnnotation(null)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CategoryIcon className="w-4 h-4" />
              <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[annotation.priority]}`}>
                {annotation.priority}
              </span>
              <span className="text-xs text-gray-500">
                {annotation.category}
              </span>
              {annotation.isResolved && (
                <span className="text-xs text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolved
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-800 mb-2">
              {editingAnnotation === annotation.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p>{annotation.content}</p>
              )}
            </div>

            {annotation.selectedText && (
              <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="text-xs text-yellow-700 font-medium mb-1">Selected text:</div>
                <div className="text-sm text-yellow-800 italic">"{annotation.selectedText}"</div>
              </div>
            )}

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{annotation.author.name || annotation.author.username}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(annotation.createdAt)}</span>
              </div>
            </div>

            {annotation.resolvedAt && annotation.resolvedByUser && (
              <div className="mt-2 text-xs text-gray-500">
                Resolved by {annotation.resolvedByUser.name || annotation.resolvedByUser.username} on {formatDate(annotation.resolvedAt)}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-4">
            {!isReply && !readOnly && (
              <button
                onClick={() => setReplyingTo(replyingTo === annotation.id ? null : annotation.id)}
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
                    setEditingAnnotation(annotation.id);
                    setEditContent(annotation.content);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAnnotation(annotation.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reply form */}
        {replyingTo === annotation.id && !readOnly && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <textarea
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
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
                  onClick={handleAddAnnotation}
                  disabled={!newAnnotation.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {annotation.replies && annotation.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {annotation.replies.map(reply => renderAnnotation(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const filteredAnnotations = annotations.filter(annotation => 
    showResolved || !annotation.isResolved
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Document Viewer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contract Document</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {showResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showResolved ? 'Hide' : 'Show'} resolved</span>
            </button>
          </div>
        </div>

        <div 
          ref={documentRef}
          className="prose max-w-none p-6 border border-gray-200 rounded-lg bg-white min-h-[600px] overflow-auto"
          dangerouslySetInnerHTML={{ 
            __html: createHighlightedContent() 
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('annotation-highlight')) {
              const annotationId = target.getAttribute('data-annotation-id');
              if (annotationId) {
                setSelectedAnnotation(annotationId);
                // Scroll to annotation in sidebar
                const annotationElement = document.getElementById(`annotation-${annotationId}`);
                if (annotationElement) {
                  annotationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
          }}
        />

        {/* Annotation form */}
        {showAnnotationForm && !readOnly && (
          <div ref={annotationFormRef} className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {selectedText && (
                <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="text-xs text-yellow-700 font-medium mb-1">Selected text:</div>
                  <div className="text-sm text-yellow-800 italic">"{selectedText}"</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as keyof typeof CATEGORY_COLORS)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CATEGORY_COLORS).map(([key, value]) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as keyof typeof PRIORITY_COLORS)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(PRIORITY_COLORS).map(([key, value]) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <textarea
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                placeholder="Write your annotation..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowAnnotationForm(false);
                    setNewAnnotation('');
                    setSelectedText('');
                    setSelectionRange(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAnnotation}
                  disabled={!newAnnotation.trim()}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Add Annotation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Annotations Sidebar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Highlighter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Annotations</h3>
            <span className="text-sm text-gray-500">({filteredAnnotations.length})</span>
          </div>
          
          {!readOnly && (
            <button
              onClick={() => setShowAnnotationForm(!showAnnotationForm)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Annotation</span>
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Annotations list */}
        {filteredAnnotations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No annotations yet. Select text and add your first annotation!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredAnnotations.map(annotation => (
              <div
                key={annotation.id}
                id={`annotation-${annotation.id}`}
                className={selectedAnnotation === annotation.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
              >
                {renderAnnotation(annotation)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
