"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpDown
} from "lucide-react";
import Link from "next/link";

interface Demand {
  id: string;
  bu: string;
  department: string;
  justification: string;
  priorityLevel: string;
  expectedDeliveryDate: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
  completedAt?: string;
  user?: {
    name?: string;
    username?: string;
    department?: string;
  };
  demandLines?: Array<{
    id: string;
    itemDescription: string;
    quantity: number;
    estimatedCost: number;
    unitOfMeasure: string;
    status: string;
  }>;
  _count?: {
    demandLines?: number;
  };
}

export default function DemandsPage() {
  const { status } = useSession();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch demands
  const fetchDemands = async () => {
    try {
      const response = await fetch('/api/demands');
      if (response.ok) {
        const data = await response.json();
        setDemands(data.data?.demands || []);
        setFilteredDemands(data.data?.demands || []);
      }
    } catch (error) {
      console.error('Error fetching demands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDemands();
    }
  }, [status]);

  // Filter and sort demands
  useEffect(() => {
    let filtered = [...demands];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(demand => 
        demand.justification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demand.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demand.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demand.demandLines?.some(line => 
          line.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || false
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(demand => demand.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "ALL") {
      filtered = filtered.filter(demand => demand.priorityLevel === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortBy as keyof Demand];
      let bValue: string | number | Date = b[sortBy as keyof Demand];

      if (sortBy === "submittedAt" || sortBy === "expectedDeliveryDate") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDemands(filtered);
  }, [demands, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

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
      <Badge className={`${config.color} border`}>
        <IconComponent className="w-3 h-3 mr-1" />
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
      <Badge className={`${priorityConfig[priority as keyof typeof priorityConfig]} border`}>
        {priority}
      </Badge>
    );
  };

  const calculateTotalCost = (demandLines: Demand['demandLines']) => {
    return demandLines?.reduce((sum, line) => sum + line.estimatedCost, 0) || 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading demands...</span>
        </div>
      </div>
    );
  }



  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/lvm">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Demands</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold mt-1">Demand Management</h1>
          <p className="text-gray-600 text-sm">View and manage all demand requests</p>
        </div>
        
        <Link href="/lvm/demands/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Demand</span>
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search demands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            {/* Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submittedAt">Submitted Date</option>
                <option value="expectedDeliveryDate">Delivery Date</option>
                <option value="priorityLevel">Priority</option>
                <option value="status">Status</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demands List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Demands ({filteredDemands.length})
          </h2>
          <div className="text-xs text-gray-500">
            Showing {filteredDemands.length} of {demands.length} demands
          </div>
        </div>

        {filteredDemands.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No demands found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL" 
                  ? "Try adjusting your filters or search terms."
                  : "No demands have been created yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredDemands.map((demand) => (
              <Card key={demand.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* Main Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {demand.id}
                          </h3>
                          <p className="text-gray-600 line-clamp-1 text-sm">
                            {demand.justification}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          {getStatusBadge(demand.status)}
                          {getPriorityBadge(demand.priorityLevel)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3 text-gray-400" />
                          <span>{demand._count?.demandLines || demand.demandLines?.length || 0} items</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span>{calculateTotalCost(demand.demandLines || []).toLocaleString('vi-VN')} VND</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>Due: {formatDate(demand.expectedDeliveryDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3 text-gray-400" />
                          <span>{demand.department}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>By {demand.user?.name || 'Unknown'} • {formatDate(demand.submittedAt)}</span>
                        {demand.approvedAt && (
                          <span>✓ {formatDate(demand.approvedAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link href={`/lvm/demands/${demand.id}`}>
                        <Button variant="outline" size="sm" className="text-xs px-3 py-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 