"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MessageSquare, Paperclip, Clock, 
  AlertCircle, CheckCircle, XCircle, User, 
  Send, Plus, Users, Search, Activity
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTicketCategories, getTicketPriorities, getTicketStatuses } from "@/config/app";

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'BUG' | 'FEATURE_REQUEST' | 'SUPPORT' | 'TECHNICAL_ISSUE' | 'GENERAL';
  customerEmail: string;
  customerName: string;
  customerId?: string;
  assignedTo?: {
    id: string;
    name: string;
    username: string;
    department: string;
  };
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  firstResponseAt?: string;
  slaBreached: boolean;
  responseTime?: number;
  resolutionTime?: number;
  tags: string[];
  comments: Comment[];
  attachments: Attachment[];
  _count: {
    comments: number;
    attachments: number;
  };
}

interface Comment {
  id: string;
  content: string;
  authorType: 'AGENT' | 'CUSTOMER' | 'SYSTEM';
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
  };
}

interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    username: string;
  };
}

interface Agent {
  id: string;
  name: string;
  username: string;
  department: string;
  email: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  
  // Assignment state
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Convert to task state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskAssigneeId, setSelectedTaskAssigneeId] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [createSubtasks, setCreateSubtasks] = useState(false);
  const [conversionReason, setConversionReason] = useState("Converted from helpdesk ticket");

  // Get configuration data
  const priorityOptions = getTicketPriorities();
  const categoryOptions = getTicketCategories();
  const statusOptions = getTicketStatuses();

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }

      const ticketData = await response.json();
      setTicket(ticketData);
      setSelectedAgentId(ticketData.assignedTo?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchTicket();
    fetchAgents();
    fetchProjects();
  }, [fetchTicket, fetchAgents, fetchProjects]);

  useEffect(() => {
    if (selectedDepartment) {
      const filtered = agents.filter(agent => 
        agent.department === selectedDepartment &&
        agent.username.toLowerCase().includes(usernameSearch.toLowerCase())
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents([]);
    }
  }, [selectedDepartment, usernameSearch, agents]);

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    if (!ticket) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === 'RESOLVED' && { resolvedAt: new Date().toISOString() }),
          ...(newStatus === 'CLOSED' && { closedAt: new Date().toISOString() }),
        }),
      });

      if (response.ok) {
        setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssignmentChange = async () => {
    if (!ticket || !selectedAgentId) return;

    setAssigning(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignedToId: selectedAgentId === "unassigned" ? null : selectedAgentId 
        }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
        
        // Add a system comment about the assignment
        await fetch(`/api/tickets/${ticketId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: selectedAgentId === "unassigned" 
              ? "Ticket unassigned" 
              : `Ticket assigned to ${agents.find(a => a.id === selectedAgentId)?.name || 'Unknown Agent'}`,
            authorType: 'SYSTEM',
            isInternal: true,
          }),
        });
        
        // Refresh ticket to get updated comments
        fetchTicket();
        setShowAssignmentModal(false);
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          authorType: 'AGENT',
          isInternal,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setIsInternal(false);
        fetchTicket(); // Refresh to get new comment
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleConvertToTask = async () => {
    if (!ticket) return;

    setConverting(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/convert-to-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
          assigneeId: selectedTaskAssigneeId || ticket.assignedTo?.id,
          priority: taskPriority || ticket.priority,
          estimatedHours,
          createSubtasks,
          conversionReason,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowConvertModal(false);
        fetchTicket(); // Refresh to get updated ticket
        
        // Navigate to the created task
        if (result.task) {
          router.push(`/lvm/tasks/${result.task.id}`);
        }
      } else {
        const error = await response.json();
        console.error('Failed to convert ticket:', error);
      }
    } catch (err) {
      console.error('Failed to convert ticket to task:', err);
    } finally {
      setConverting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return <AlertCircle className="w-4 h-4" />;
    
    switch (statusConfig.icon) {
      case 'AlertCircle': return <AlertCircle className={`w-4 h-4 ${statusConfig.color}`} />;
      case 'Clock': return <Clock className={`w-4 h-4 ${statusConfig.color}`} />;
      case 'CheckCircle': return <CheckCircle className={`w-4 h-4 ${statusConfig.color}`} />;
      case 'XCircle': return <XCircle className={`w-4 h-4 ${statusConfig.color}`} />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = priorityOptions.find(p => p.value === priority);
    return priorityConfig?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = categoryOptions.find(c => c.value === category);
    if (!categoryConfig) return <MessageSquare className="w-4 h-4" />;
    
    switch (categoryConfig.icon as any) {
      case 'User': return <User className="w-4 h-4" />;
      case 'AlertCircle': return <AlertCircle className="w-4 h-4" />;
      case 'Plus': return <Plus className="w-4 h-4" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDepartments = () => {
    const departments = [...new Set(agents.map(agent => agent.department))];
    return departments.sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error loading ticket</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/lvm/helpdesk">
                <Button variant="ghost" size="sm" className="text-gray-600 text-xs">
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
                <p className="text-xs text-gray-600">{ticket.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </Badge>
              {getStatusIcon(ticket.status)}
              <Badge variant="outline" className="text-xs">
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
          {/* Main Content */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Description */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 text-xs">{ticket.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Comments ({ticket._count?.comments || ticket.comments?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {ticket.comments?.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-gray-200 pl-2 py-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-xs text-gray-900">{comment.author.name}</span>
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              {comment.authorType}
                            </Badge>
                            {comment.isInternal && (
                              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                Internal
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <form onSubmit={handleSubmitComment}>
                      <div className="space-y-2">
                        <div>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-xs"
                            placeholder="Add a comment..."
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">Internal comment</span>
                          </label>
                          <Button
                            type="submit"
                            disabled={submittingComment || !newComment.trim()}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
                          >
                            {submittingComment ? (
                              <>
                                <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3 mr-1" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              {ticket.attachments?.length > 0 && (
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Attachments ({ticket._count?.attachments || ticket.attachments?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {ticket.attachments?.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-3 h-3 text-gray-500" />
                            <div>
                              <p className="text-xs font-medium text-gray-900">{attachment.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Quick Actions */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(ticket.category)}
                      <span className="text-xs text-gray-600">
                        {ticket.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {ticket.slaBreached && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-medium text-red-800">SLA Breached</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <Button 
                      onClick={() => setShowConvertModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-xs px-3 py-1"
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      Convert to Task
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{ticket.customerName}</p>
                    <p className="text-xs text-gray-500">{ticket.customerEmail}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Info */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  {ticket.assignedTo ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3 text-gray-500" />
                        <div>
                          <p className="text-xs font-medium text-gray-900">{ticket.assignedTo.name}</p>
                          <p className="text-xs text-gray-500">{ticket.assignedTo.department}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAssignmentModal(true)}
                        className="w-full text-xs px-3 py-1"
                      >
                        Reassign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Unassigned</p>
                      <Button 
                        onClick={() => setShowAssignmentModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Assign Agent
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Assign Agent</h3>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Step 1: Department Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setUsernameSearch("");
                        setSelectedAgentId("");
                      }}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="">Choose department...</option>
                      {getDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Username Search */}
                  {selectedDepartment && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Search by Username
                      </label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="text"
                          value={usernameSearch}
                          onChange={(e) => setUsernameSearch(e.target.value)}
                          placeholder="Enter username..."
                          className="w-full pl-7 pr-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Agent Results */}
                  {selectedDepartment && filteredAgents.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Select Agent
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredAgents.map((agent) => (
                          <div
                            key={agent.id}
                            onClick={() => setSelectedAgentId(agent.id)}
                            className={`p-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              selectedAgentId === agent.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-900">{agent.name}</p>
                                <p className="text-xs text-gray-500">@{agent.username}</p>
                              </div>
                              {selectedAgentId === agent.id && (
                                <CheckCircle className="w-3 h-3 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {selectedDepartment && usernameSearch && filteredAgents.length === 0 && (
                    <div className="text-center py-3">
                      <p className="text-xs text-gray-500">No agents found</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignmentModal(false)}
                      className="flex-1 text-xs px-3 py-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignmentChange}
                      disabled={assigning || !selectedAgentId}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
                    >
                      {assigning ? (
                        <>
                          <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1"></div>
                          Assigning...
                        </>
                      ) : (
                        'Assign Ticket'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Convert to Task Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Convert to Task</h3>
                  <button
                    onClick={() => setShowConvertModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Project Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Project (Optional)
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="">No project assigned</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Task Assignee */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Assignee
                    </label>
                    <select
                      value={selectedTaskAssigneeId}
                      onChange={(e) => setSelectedTaskAssigneeId(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name} (@{agent.username})</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="">Use ticket priority ({ticket?.priority})</option>
                      <option value="URGENT">Urgent</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 2)}
                      min="1"
                      max="100"
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                    />
                  </div>

                  {/* Create Subtasks */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={createSubtasks}
                        onChange={(e) => setCreateSubtasks(e.target.checked)}
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">Create subtasks (Investigate, Develop, Test, Deploy)</span>
                    </label>
                  </div>

                  {/* Conversion Reason */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Conversion Reason
                    </label>
                    <textarea
                      value={conversionReason}
                      onChange={(e) => setConversionReason(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs resize-none"
                      placeholder="Reason for converting this ticket to a task..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConvertModal(false)}
                      className="flex-1 text-xs px-3 py-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConvertToTask}
                      disabled={converting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs px-3 py-1"
                    >
                      {converting ? (
                        <>
                          <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1"></div>
                          Converting...
                        </>
                      ) : (
                        'Convert to Task'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 