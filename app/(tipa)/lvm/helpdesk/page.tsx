"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Plus, Search, Filter, MoreVertical, MessageSquare, 
  Clock, AlertCircle, CheckCircle, XCircle, User,
  FileText, Bug, Wrench, Star, Calendar
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
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
  _count: {
    comments: number;
    attachments: number;
  };
}

interface TicketsResponse {
  tickets: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function HelpdeskDashboard() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Get configuration data
  const statusOptions = getTicketStatuses();
  const priorityOptions = getTicketPriorities();
  const categoryOptions = getTicketCategories();

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/tickets?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data: TicketsResponse = await response.json();
      setTickets(data.tickets);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, searchTerm]);

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
    if (!categoryConfig) return <FileText className="w-4 h-4" />;
    
    switch (categoryConfig.icon as any) {
      case 'User': return <User className="w-4 h-4" />;
      case 'AlertCircle': return <AlertCircle className="w-4 h-4" />;
      case 'Plus': return <Plus className="w-4 h-4" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      case 'Search': return <Search className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const ticketColumns = [
    {
      key: "ticket",
      header: "Ticket",
      render: (ticket: Ticket) => (
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {ticket.ticketNumber.split('-')[3]}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <Link 
              href={`/lvm/helpdesk/tickets/${ticket.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {ticket.title}
            </Link>
            <div className="text-xs text-gray-500 mt-1">
              {ticket.customerName} • {ticket.customerEmail}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {ticket.ticketNumber} • Created {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (ticket: Ticket) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(ticket.status)}
          <Badge variant="outline" className="text-xs">
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
      )
    },
    {
      key: "priority",
      header: "Priority",
      render: (ticket: Ticket) => (
        <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </Badge>
      )
    },
    {
      key: "category",
      header: "Category",
      render: (ticket: Ticket) => (
        <div className="flex items-center space-x-2">
          {getCategoryIcon(ticket.category)}
          <span className="text-sm text-gray-600">
            {ticket.category.replace('_', ' ')}
          </span>
        </div>
      )
    },
    {
      key: "assigned",
      header: "Assigned To",
      render: (ticket: Ticket) => (
        <div className="text-sm text-gray-900">
          {ticket.assignedTo ? (
            <div>
              <div className="font-medium">{ticket.assignedTo.name}</div>
              <div className="text-xs text-gray-500">{ticket.assignedTo.department}</div>
            </div>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>
      )
    },
    {
      key: "activity",
      header: "Activity",
      render: (ticket: Ticket) => (
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4" />
            <span>{ticket._count.comments}</span>
          </div>
          {ticket.slaBreached && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>SLA</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (ticket: Ticket) => (
        <div className="flex items-center justify-end space-x-2">
          <Link
            href={`/lvm/helpdesk/tickets/${ticket.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </Link>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TIPA Helpdesk</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage customer support tickets and requests
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/lvm/helpdesk/tickets/new">
                <Button className="inline-flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500 text-white">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter(t => t.status === 'OPEN').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500 text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter(t => t.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-500 text-white">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">SLA Breached</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter(t => t.slaBreached).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter(t => t.status === 'RESOLVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              {pagination && `Showing ${tickets.length} of ${pagination.total} tickets`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={tickets}
              columns={ticketColumns}
              loading={loading}
              emptyMessage="No tickets found"
            />
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 