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
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface LegalReview {
  id: string;
  contractId: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewerId: string;
  reviewerName: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export default function LegalPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [legalReviews, setLegalReviews] = useState<LegalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");

  // Check if user has legal department access
  const isLegalUser = session?.user?.department === 'LEGAL' || 
                     session?.user?.role === 'ADMIN' || 
                     session?.user?.role === 'GENERAL_DIRECTOR';

  useEffect(() => {
    if (isLegalUser) {
      fetchContracts();
      fetchLegalReviews();
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

  const fetchLegalReviews = async () => {
    try {
      // For now, we'll skip this API call since the endpoint doesn't exist yet
      // This will be implemented when the legal review system is fully built
      setLegalReviews([]);
    } catch (error) {
      console.error('Error fetching legal reviews:', error);
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
      <Tabs defaultValue="contracts" className="space-y-4">
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
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
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Legal Review History</h3>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Legal review functionality coming soon...</p>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
