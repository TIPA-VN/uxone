"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Settings,
  MessageSquare,
  Loader2,
  BarChart3,
  Shield,
  Ticket,
  Database,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  assignedTo?: {
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  pendingTickets: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
}

function HelpdeskPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedToday: 0,
    pendingTickets: 0,
    averageResolutionTime: 0,
    customerSatisfaction: 0,
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get user's department and role
  const userDepartment = session?.user?.department || session?.user?.centralDepartment;
  const userRole = session?.user?.role;
  
  // Check if user is IS department or admin
  const isISDepartment = userDepartment === 'IS';
  const isAdmin = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'].includes(userRole || '');
  const canSeeAllTickets = isISDepartment || isAdmin;

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API URL with department filter
      let apiUrl = "/api/tickets?limit=1000";
      if (!canSeeAllTickets && userDepartment) {
        apiUrl += `&department=${encodeURIComponent(userDepartment)}`;
      }

      console.log('🔍 Fetching tickets from:', apiUrl);
      console.log('🔍 User department:', userDepartment);
      console.log('🔍 Can see all tickets:', canSeeAllTickets);

      // Fetch tickets
      const ticketsResponse = await fetch(apiUrl);
      console.log('🔍 Tickets response status:', ticketsResponse.status);
      
      if (!ticketsResponse.ok) {
        const errorText = await ticketsResponse.text();
        console.error('🔍 Tickets API error:', errorText);
        throw new Error(`Failed to fetch tickets: ${ticketsResponse.status} ${errorText}`);
      }

      const ticketsData = await ticketsResponse.json();
      console.log('🔍 Tickets data received:', ticketsData);
      
      let tickets = ticketsData.tickets || [];

      // Ensure tickets is an array before processing
      if (!Array.isArray(tickets)) {
        console.error('🔍 Invalid tickets data format:', tickets);
        tickets = [];
      }

      // Calculate stats
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(
        (ticket: Ticket) =>
          ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
      ).length;
      const pendingTickets = tickets.filter(
        (ticket: Ticket) => ticket.status === "PENDING"
      ).length;

      // Calculate resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const resolvedToday = tickets.filter((ticket: Ticket) => {
        if (ticket.status !== "RESOLVED") return false;
        const resolvedDate = new Date(ticket.updatedAt);
        return resolvedDate >= today;
      }).length;

      // Calculate average resolution time (mock for now)
      const averageResolutionTime = 4.5; // hours

      // Calculate customer satisfaction (mock for now)
      const customerSatisfaction = 92; // percentage

      setStats({
        totalTickets,
        openTickets,
        resolvedToday,
        pendingTickets,
        averageResolutionTime,
        customerSatisfaction,
      });

      // Get recent tickets (last 5)
      const recentTicketsData = tickets
        .sort(
          (a: Ticket, b: Ticket) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      setRecentTickets(recentTicketsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [userDepartment, canSeeAllTickets]);

  useEffect(() => {
    if (sessionStatus === 'loading') {
      return; // Wait for session to load
    }
    
    if (sessionStatus === 'unauthenticated') {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }
    
    if (session) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, session, sessionStatus]);

  const handleViewTicket = (ticketId: string) => {
    router.push(`/lvm/helpdesk/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    router.push(`/lvm/helpdesk/tickets/${ticketId}/edit`);
  };

  // Get department display name
  const getDepartmentDisplayName = () => {
    if (isISDepartment) return "Information Systems";
    if (userDepartment) return userDepartment;
    return "Department";
  };

  // Get dashboard title and description
  const getDashboardInfo = () => {
    if (isISDepartment) {
      return {
        title: "Information Systems Dashboard",
        description: "Helpdesk management and IT support system"
      };
    } else {
      return {
        title: `${getDepartmentDisplayName()} Support Dashboard`,
        description: `Support tickets and requests for ${getDepartmentDisplayName()}`
      };
    }
  };

  // Show loading state while session is loading
  if (sessionStatus === 'loading') {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Authentication required. Please log in to access the helpdesk.</p>
          <Button
            onClick={() => router.push('/auth/signin')}
            variant="outline"
            className="mt-2"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading dashboard: {error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const dashboardInfo = getDashboardInfo();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {dashboardInfo.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {dashboardInfo.description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={`${
              isISDepartment 
                ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {getDepartmentDisplayName()}
          </Badge>
          <Button asChild>
            <Link href="/lvm/helpdesk/tickets/new">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {canSeeAllTickets ? "All time tickets" : "Department tickets"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.openTickets}
            </div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.resolvedToday}
            </div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingTickets}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Resolution
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageResolutionTime}h
            </div>
            <p className="text-xs text-muted-foreground">Hours to resolve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Satisfaction
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.customerSatisfaction}%
            </div>
            <p className="text-xs text-muted-foreground">Customer rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Department-specific content */}
      {!isISDepartment && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Department Support Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-3">
              You are viewing support tickets and requests for <strong>{getDepartmentDisplayName()}</strong>. 
              {!canSeeAllTickets && " You can only see tickets related to your department."}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/lvm/helpdesk/tickets">
                  View All Tickets
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/lvm/helpdesk/reports">
                  Department Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Recent Tickets
            {!canSeeAllTickets && (
              <Badge variant="secondary" className="ml-2">
                {getDepartmentDisplayName()} Only
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {canSeeAllTickets 
              ? "Latest support tickets across all departments"
              : `Latest support tickets for ${getDepartmentDisplayName()}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tickets found</p>
              {!canSeeAllTickets && (
                <p className="text-sm mt-1">This may be because there are no tickets for your department yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {ticket.ticketNumber} - {ticket.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Category: {ticket.category} | Priority: {ticket.priority}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            ticket.status === "OPEN"
                              ? "default"
                              : ticket.status === "IN_PROGRESS"
                              ? "secondary"
                              : ticket.status === "RESOLVED"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {ticket.status}
                        </Badge>
                        <Badge
                          variant={
                            ticket.priority === "HIGH"
                              ? "destructive"
                              : ticket.priority === "MEDIUM"
                              ? "default"
                              : "outline"
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTicket(ticket.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {canSeeAllTickets && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTicket(ticket.id)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-green-600" />
              Create Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Submit a new support request or report an issue
            </p>
            <Button asChild className="w-full">
              <Link href="/lvm/helpdesk/tickets/new">
                New Ticket
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-blue-600" />
              View Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Browse and manage all support tickets
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/lvm/helpdesk/tickets">
                Browse Tickets
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View analytics and performance reports
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/lvm/helpdesk/reports">
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* IS-specific features */}
      {isISDepartment && (
        <Card className="bg-cyan-50 border-cyan-200">
          <CardHeader>
            <CardTitle className="text-cyan-800 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              IT Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-cyan-700 mb-3">
              As an Information Systems user, you have access to additional IT administration features.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/lvm/helpdesk/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Helpdesk Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/lvm/admin">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export with dynamic import to prevent SSR issues
export default dynamic(() => Promise.resolve(HelpdeskPageContent), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading helpdesk...</p>
      </div>
    </div>
  ),
});
