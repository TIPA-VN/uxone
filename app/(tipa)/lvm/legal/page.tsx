"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  X,
  Check,
  Scale,
  Play,
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LegalReviewConversation from "@/components/LegalReviewConversation";

interface Contract {
  id: string;
  contractNumber: string;
  projectName: string;
  counterparty: string;
  value: number;
  currency: string;
  contractStatus: string;
  legalReviewStatus: string;
  createdAt: string;
  dueDate?: string;
  commentsCount: number;
}

interface LegalReviewRequest {
  id: string;
  contractId: string;
  status: 'PENDING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
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

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    username: string;
  };
  createdAt: string;
  isResolved: boolean;
  priority: string;
  category: string;
}

interface CommentsListProps {
  contractId: string;
  onCommentResolved: () => void;
}

function CommentsList({ contractId, onCommentResolved }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [contractId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveComment = async (commentId: string) => {
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

      if (response.ok) {
        await fetchComments();
        onCommentResolved();
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  if (comments.length === 0) {
    return <div className="text-center py-4 text-gray-500">No legal comments yet</div>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className={`border rounded-lg p-4 ${comment.isResolved ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <Badge variant={comment.priority === 'HIGH' ? 'destructive' : comment.priority === 'NORMAL' ? 'default' : 'secondary'}>
                {comment.priority}
              </Badge>
              {comment.isResolved && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
          {!comment.isResolved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => resolveComment(comment.id)}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark as Resolved
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LegalPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [legalReviewRequests, setLegalReviewRequests] = useState<LegalReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedLegalReviewRequest, setSelectedLegalReviewRequest] = useState<LegalReviewRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState("contracts");
  const [reviewStatus, setReviewStatus] = useState("in_review");
  const [reviewComments, setReviewComments] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Check if user has legal department access
  const isLegalUser = session?.user?.department === 'LEGAL' || 
                     session?.user?.role === 'ADMIN' || 
                     session?.user?.role === 'GENERAL_DIRECTOR';

  useEffect(() => {
    if (isLegalUser) {
      fetchContracts();
      fetchLegalReviewRequests();
    }
  }, [isLegalUser]);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts?includeLegalReview=true');
      if (response.ok) {
        const data = await response.json();
        // Ensure we have an array and add default values for missing fields
        const contractsWithDefaults = (Array.isArray(data) ? data : []).map((contract: any) => ({
          ...contract,
          contractNumber: contract.contractNumber || 'N/A',
          projectName: contract.projectName || contract.name || 'Unnamed Project',
          counterparty: contract.counterparty || 'N/A',
          value: contract.value || 0,
          currency: contract.currency || 'THB',
          contractStatus: contract.contractStatus || 'DRAFT',
          legalReviewStatus: contract.legalReviewStatus || 'PENDING',
          createdAt: contract.createdAt || new Date().toISOString(),
          commentsCount: contract.commentsCount || 0
        }));
        setContracts(contractsWithDefaults);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLegalReviewRequests = async () => {
    try {
      const response = await fetch('/api/legal-review-requests');
      if (response.ok) {
        const data = await response.json();
        setLegalReviewRequests(data.legalReviewRequests || []);
      }
    } catch (error) {
      console.error('Error fetching legal review requests:', error);
      setLegalReviewRequests([]);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = (contract.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contract.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contract.counterparty || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.contractStatus === statusFilter;
    const matchesReviewStatus = reviewStatusFilter === "all" || contract.legalReviewStatus === reviewStatusFilter;
    
    return matchesSearch && matchesStatus && matchesReviewStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'PENDING_APPROVAL': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      'ACTIVE': { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      'EXPIRED': { color: 'bg-orange-100 text-orange-800', label: 'Expired' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getReviewStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review', icon: Clock },
      'IN_REVIEW': { color: 'bg-blue-100 text-blue-800', label: 'In Review', icon: Eye },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: AlertCircle }
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

  const handleReviewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowReviewModal(true);
    // Reset form when selecting a new contract
    setReviewStatus("in_review");
    setReviewComments("");
  };

  const handleStartLegalReview = async (contract: Contract) => {
    if (!contract.contractDetails?.id) {
      alert('Contract details not available. Please try refreshing the page.');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/contracts/${contract.contractDetails.id}/legal-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'START_REVIEW',
          comment: reviewComments || 'Legal review requested'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.existingReview) {
          // Show existing review
          setSelectedLegalReviewRequest(result.existingReview);
          setActiveTab("reviews");
          setShowReviewModal(false);
        } else {
          throw new Error(result.error || 'Failed to start legal review');
        }
      } else {
        alert('Legal review request created successfully!');
        await fetchContracts();
        await fetchLegalReviewRequests();
        setReviewComments("");
      }
    } catch (error) {
      console.error('Error starting legal review:', error);
      alert(`Failed to start legal review: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignReview = async (contract: Contract) => {
    if (!contract.contractDetails?.id) {
      alert('Contract details not available. Please try refreshing the page.');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/contracts/${contract.contractDetails.id}/legal-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ASSIGN_REVIEW'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign review');
      }

      alert('Legal review assigned successfully!');
      await fetchContracts();
      await fetchLegalReviewRequests();
    } catch (error) {
      console.error('Error assigning review:', error);
      alert(`Failed to assign review: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseReviewModal = () => {
    setSelectedContract(null);
    setShowReviewModal(false);
  };

  const handleSaveReview = async () => {
    if (!selectedContract) return;
    
    console.log('Selected contract data:', selectedContract);
    console.log('Contract details:', selectedContract.contractDetails);
    
    if (!reviewStatus || !reviewComments.trim()) {
      alert('Please select a review status and enter comments.');
      return;
    }
    
    if (!selectedContract.contractDetails?.id) {
      console.error('Contract details not available:', selectedContract.contractDetails);
      alert('Contract details not available. Please try refreshing the page.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Map review status to API action
      let action = 'START_REVIEW';
      if (reviewStatus === 'approved') {
        action = 'COMPLETE_REVIEW';
      } else if (reviewStatus === 'changes_requested') {
        action = 'REQUEST_CHANGES';
      }
      
      // Call the legal review API
      console.log('Sending legal review request:', {
        contractId: selectedContract.contractDetails.id,
        action,
        comment: reviewComments
      });
      
      const response = await fetch(`/api/contracts/${selectedContract.contractDetails.id}/legal-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comment: reviewComments
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save review');
      }
      
      // Update the contract's review status
      setContracts(prevContracts => 
        prevContracts.map(contract => 
          contract.id === selectedContract.id 
            ? { 
                ...contract, 
                legalReviewStatus: reviewStatus.toUpperCase(),
                contractDetails: {
                  ...contract.contractDetails,
                  contractStatus: result.contract?.contractStatus || contract.contractDetails?.contractStatus
                }
              }
            : contract
        )
      );
      
      // Show success message
      alert('Review saved successfully!');
      
      // Refresh contracts data to show updated status
      await fetchContracts();
      
      // Reset form
      setReviewComments("");
      setReviewStatus("in_review");
      
    } catch (error) {
      console.error('Error saving review:', error);
      alert(`Failed to save review: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!reviewComments.trim()) {
      alert('Please enter a comment before adding.');
      return;
    }
    
    if (!selectedContract?.contractDetails?.id) {
      alert('Contract details not available. Please try refreshing the page.');
      return;
    }
    
    try {
      // Call the comments API to add a comment
      console.log('Sending comment request:', {
        contractId: selectedContract.contractDetails.id,
        content: reviewComments,
        category: 'LEGAL',
        priority: 'NORMAL'
      });
      
      const response = await fetch(`/api/contracts/${selectedContract.contractDetails.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reviewComments,
          category: 'LEGAL',
          priority: 'NORMAL'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add comment');
      }
      
      alert('Comment added successfully!');
      
      // Refresh contracts data to show updated comments
      await fetchContracts();
      
      // Clear the comment field
      setReviewComments("");
      
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(`Failed to add comment: ${error.message}`);
    }
  };

  const handleCompleteReview = async () => {
    if (!selectedContract?.contractDetails?.id) {
      alert('Contract details not available. Please try refreshing the page.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/contracts/${selectedContract.contractDetails.id}/legal-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'COMPLETE_REVIEW',
          comment: reviewComments || 'Legal review completed'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete review');
      }
      
      alert('Review completed successfully!');
      
      // Refresh contracts data to show updated status
      await fetchContracts();
      
      // Reset form
      setReviewComments("");
      setReviewStatus("in_review");
      
    } catch (error) {
      console.error('Error completing review:', error);
      alert(`Failed to complete review: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedContract?.contractDetails?.id) {
      alert('Contract details not available. Please try refreshing the page.');
      return;
    }
    
    if (!reviewComments.trim()) {
      alert('Please enter comments explaining what changes are needed.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/contracts/${selectedContract.contractDetails.id}/legal-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'REQUEST_CHANGES',
          comment: reviewComments
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to request changes');
      }
      
      alert('Changes requested successfully!');
      
      // Refresh contracts data to show updated status
      await fetchContracts();
      
      // Reset form
      setReviewComments("");
      setReviewStatus("in_review");
      
    } catch (error) {
      console.error('Error requesting changes:', error);
      alert(`Failed to request changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLegalUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You don't have permission to access the Legal department page. 
              This page is restricted to Legal department members and administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading legal contracts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Department</h1>
          <p className="text-gray-600 mt-1">Contract review and legal advice management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {contracts.filter(c => c.legalReviewStatus === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">
                  {contracts.filter(c => c.legalReviewStatus === 'IN_REVIEW').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {contracts.filter(c => c.legalReviewStatus === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="reviews">Legal Reviews</TabsTrigger>
          <TabsTrigger value="comments">Comments & Advice</TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search contracts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Contract Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reviewStatusFilter} onValueChange={setReviewStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Review Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Review Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending Review</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contracts List */}
          <div className="space-y-4">
            {filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== "all" || reviewStatusFilter !== "all"
                      ? "No contracts match your current filters."
                      : "No contracts are available for legal review."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredContracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {contract.contractNumber}
                          </h3>
                          {getStatusBadge(contract.contractStatus)}
                          {getReviewStatusBadge(contract.legalReviewStatus)}
                        </div>
                        <p className="text-gray-600 mb-2">{contract.projectName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Counterparty: {contract.counterparty}</span>
                          <span>Value: {contract.currency} {contract.value?.toLocaleString()}</span>
                          <span>Created: {new Date(contract.createdAt).toLocaleDateString()}</span>
                          {contract.dueDate && (
                            <span>Due: {new Date(contract.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contract.commentsCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageSquare className="w-4 h-4" />
                            {contract.commentsCount}
                          </div>
                        )}
                        
                        {/* Check if there's an existing legal review request */}
                        {(() => {
                          const existingReview = legalReviewRequests.find(req => req.contractId === contract.id);
                          
                          if (existingReview) {
                            if (existingReview.status === 'PENDING') {
                              return (
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700"
                                  size="sm"
                                  onClick={() => handleAssignReview(contract)}
                                  disabled={isSaving}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  {isSaving ? 'Assigning...' : 'Assign Review'}
                                </Button>
                              );
                            } else if (['IN_REVIEW', 'CHANGES_REQUESTED'].includes(existingReview.status)) {
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLegalReviewRequest(existingReview);
                                    setActiveTab("reviews");
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  View Conversation
                                </Button>
                              );
                            }
                          }
                          
                          // No existing review or completed review
                          return (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReviewContract(contract)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Legal Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          {selectedLegalReviewRequest ? (
            <div className="space-y-4">
              {/* Contract Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Legal Review Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Contract:</span>
                      <p className="text-gray-900">{selectedContract?.contractNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Project:</span>
                      <p className="text-gray-900">{selectedContract?.projectName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Counterparty:</span>
                      <p className="text-gray-900">{selectedContract?.counterparty || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedLegalReviewRequest(null);
                        setSelectedContract(null);
                      }}
                    >
                      Back to List
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowReviewModal(true)}
                    >
                      View Contract Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Component */}
              <LegalReviewConversation
                contractId={selectedContract?.contractDetails?.id || ''}
                legalReviewRequest={selectedLegalReviewRequest}
                currentUser={{
                  id: session?.user?.id || '',
                  name: session?.user?.name || '',
                  username: session?.user?.username || '',
                  department: session?.user?.department || '',
                  role: session?.user?.role || ''
                }}
                onCommentAdded={() => {
                  // Refresh the legal review request data
                  fetchLegalReviewRequests();
                }}
                onCommentResolved={() => {
                  // Refresh the legal review request data
                  fetchLegalReviewRequests();
                }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Legal Review Requests</h3>
                
                {legalReviewRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No legal review requests found</p>
                    <p className="text-sm text-gray-500">
                      Legal review requests will appear here when contracts are submitted for review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {legalReviewRequests.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Contract Review Request
                                </h4>
                                {getReviewStatusBadge(request.status)}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Requested by:</span> {request.requestedByUser.name} ({request.requestedByUser.department})
                                </div>
                                {request.assignedToUser && (
                                  <div>
                                    <span className="font-medium">Assigned to:</span> {request.assignedToUser.name} ({request.assignedToUser.department})
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Comments:</span> {request.comments.length}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Find the contract for this review request
                                  const contract = contracts.find(c => c.id === request.contractId);
                                  if (contract) {
                                    setSelectedContract(contract);
                                    setSelectedLegalReviewRequest(request);
                                  }
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                View Conversation
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comments & Advice Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comments & Legal Advice</h3>
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Comments and legal advice management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {showReviewModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Contract Review: {selectedContract.contractNumber}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseReviewModal}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Contract Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <p className="text-gray-900">{selectedContract.projectName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Counterparty
                    </label>
                    <p className="text-gray-900">{selectedContract.counterparty}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Value
                    </label>
                    <p className="text-gray-900">
                      {selectedContract.currency} {selectedContract.value?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="mt-1">
                      {getStatusBadge(selectedContract.contractStatus)}
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Legal Review Actions</h3>
                  <div className="flex gap-3">
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => {
                        setActiveTab("reviews");
                        setShowReviewModal(false);
                        // Reset form when starting review
                        setReviewStatus("in_review");
                        setReviewComments("");
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Start Review
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // TODO: Implement approve
                        alert('Approve functionality coming soon!');
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        // TODO: Implement reject
                        alert('Reject functionality coming soon!');
                      }}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const projectId = selectedContract.contractDetails?.project?.id || selectedContract.project?.id;
                        if (projectId) {
                          window.open(`/lvm/projects/${projectId}`, '_blank');
                        } else {
                          alert('Project ID not available. Please try refreshing the page.');
                        }
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Project
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Legal Comments</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">
                      Legal commenting functionality will be implemented here.
                      This will allow legal specialists to add comments and advice
                      on the contract without modifying the original document.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
