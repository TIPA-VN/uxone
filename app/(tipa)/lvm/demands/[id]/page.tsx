"use client";

import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  ArrowLeft, 
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
  Building,
  CreditCard,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  // Send,
  // Edit,
  // Download
} from "lucide-react";
import Link from "next/link";

interface DemandLine {
  id: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  unitOfMeasure: string;
  specifications?: string;
  supplierPreference?: string;
  status: string;
}

interface Demand {
  id: string;
  bu: string;
  department: string;
  account: number;
  approvalRoute?: string;
  expenseAccount: number;
  expenseDescription: string;
  expenseGLClass: string;
  expenseStockType: string;
  expenseOrderType: string;
  justification: string;
  priorityLevel: string;
  expectedDeliveryDate: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  completedAt?: string;
  user: {
    id: string;
    name: string;
    username: string;
    department: string;
    email?: string;
  };
  demandLines: DemandLine[];
}

export default function DemandDetailPage() {
  const { data: session, status } = useSession();
  // const router = useRouter();
  const params = useParams();
  const demandId = params.id as string;
  
  const [demand, setDemand] = useState<Demand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  // Check if user can approve this demand
  const canApprove = () => {
    if (!session?.user || !demand) return false;
    
    const userRole = session.user.role?.toUpperCase() || "";
    const userDepartment = session.user.department || session.user.centralDepartment;
    
    // Admin can approve anything
    if (userRole.includes("ADMIN")) return true;
    
    // Manager roles can approve
    if (userRole.includes("MANAGER") || userRole.includes("DIRECTOR")) return true;
    
    // Department head can approve demands from their department
    if (userDepartment === demand.department && userRole.includes("SUPERVISOR")) return true;
    
    return false;
  };

  // Fetch demand details
  const fetchDemand = async () => {
    try {
      const response = await fetch(`/api/demands/${demandId}`);
      if (response.ok) {
        const data = await response.json();
        setDemand(data.demand);
      } else {
        console.error('Error fetching demand:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching demand:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approval/rejection
  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!demand) return;
    
    setIsApproving(true);
    try {
      const response = await fetch(`/api/demands/${demandId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comment: approvalComment,
        }),
      });

      if (response.ok) {
        // Refresh demand data
        await fetchDemand();
        setShowApprovalForm(false);
        setApprovalComment("");
      } else {
        console.error('Error updating demand:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating demand:', error);
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && demandId) {
      fetchDemand();
    }
  }, [status, demandId, fetchDemand]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      APPROVED: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      IN_PROGRESS: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
      COMPLETED: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border text-sm px-3 py-1`}>
        <IconComponent className="w-4 h-4 mr-2" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: "bg-gray-100 text-gray-800 border-gray-200",
      MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      URGENT: "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <Badge className={`${priorityConfig[priority as keyof typeof priorityConfig]} border text-sm px-3 py-1`}>
        {priority}
      </Badge>
    );
  };

  const calculateTotalCost = () => {
    if (!demand) return 0;
    return demand.demandLines.reduce((sum, line) => sum + line.estimatedCost, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading demand details...</span>
        </div>
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Demand not found</h2>
          <p className="text-gray-600 mb-4">The demand you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Link href="/lvm/demands">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demands
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/lvm">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/lvm/demands">Demands</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{demand.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center space-x-4 mt-2">
            <h1 className="text-3xl font-bold">{demand.id}</h1>
            <div className="flex items-center space-x-2">
              {getStatusBadge(demand.status)}
              {getPriorityBadge(demand.priorityLevel)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/lvm/demands">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demands
            </Button>
          </Link>
          {canApprove() && demand.status === "PENDING" && (
            <Button 
              onClick={() => setShowApprovalForm(!showApprovalForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Review & Approve
            </Button>
          )}
        </div>
      </div>

      {/* Approval Form */}
      {showApprovalForm && canApprove() && demand.status === "PENDING" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <MessageSquare className="h-5 w-5" />
              <span>Review & Approval</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Provide your decision and comments for this demand request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Comments (Optional)
              </label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add any comments or feedback..."
                className="border-blue-300 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleApproval('approve')}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4 mr-2" />
                )}
                Approve Demand
              </Button>
              <Button
                onClick={() => handleApproval('reject')}
                disabled={isApproving}
                variant="destructive"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4 mr-2" />
                )}
                Reject Demand
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApprovalForm(false)}
                disabled={isApproving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demand Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Demand Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Justification</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {demand.justification}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Expected Delivery</p>
                    <p className="font-medium">{formatDate(demand.expectedDeliveryDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Total Estimated Cost</p>
                    <p className="font-medium">{calculateTotalCost().toLocaleString('vi-VN')} VND</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demand Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Items ({demand.demandLines.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demand.demandLines.map((line, index) => (
                  <div key={line.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                      <Badge variant="outline">{line.status}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-gray-700">{line.itemDescription}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Quantity:</span>
                          <span className="ml-2 font-medium">{line.quantity} {line.unitOfMeasure}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span className="ml-2 font-medium">{line.estimatedCost.toLocaleString('vi-VN')} VND</span>
                        </div>
                        {line.specifications && (
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Specifications:</span>
                            <span className="ml-2">{line.specifications}</span>
                          </div>
                        )}
                        {line.supplierPreference && (
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Preferred Supplier:</span>
                            <span className="ml-2">{line.supplierPreference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Requester</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{demand.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{demand.user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{demand.user.department}</p>
              </div>
              {demand.user.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{demand.user.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department & Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Department & Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Business Unit</p>
                <p className="font-medium">{demand.bu}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{demand.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account</p>
                <p className="font-medium">{demand.account}</p>
              </div>
              {demand.approvalRoute && (
                <div>
                  <p className="text-sm text-gray-500">Approval Route</p>
                  <p className="font-medium">{demand.approvalRoute}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Expense Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Account</p>
                <p className="font-medium">{demand.expenseAccount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{demand.expenseDescription}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GL Class</p>
                <p className="font-medium">{demand.expenseGLClass}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock Type</p>
                <p className="font-medium">{demand.expenseStockType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Type</p>
                <p className="font-medium">{demand.expenseOrderType}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium">{formatDate(demand.submittedAt)}</p>
              </div>
              {demand.approvedAt && (
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="font-medium">{formatDate(demand.approvedAt)}</p>
                </div>
              )}
              {demand.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">{formatDate(demand.completedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 