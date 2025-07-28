"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Ticket, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function ISHomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedToday: 0,
    pendingTickets: 0,
    averageResolutionTime: 0,
    customerSatisfaction: 0
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all tickets for stats calculation
        const ticketsResponse = await fetch('/api/tickets?limit=1000');
        if (!ticketsResponse.ok) {
          throw new Error('Failed to fetch tickets');
        }
        
        const ticketsData = await ticketsResponse.json();
        const tickets = ticketsData.tickets || [];
        
        // Calculate stats
        const totalTickets = tickets.length;
        const openTickets = tickets.filter((ticket: Ticket) => 
          ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
        ).length;
        const pendingTickets = tickets.filter((ticket: Ticket) => 
          ticket.status === 'PENDING'
        ).length;
        
        // Calculate resolved today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resolvedToday = tickets.filter((ticket: Ticket) => {
          if (ticket.status !== 'RESOLVED') return false;
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
          customerSatisfaction
        });
        
        // Get recent tickets (last 5)
        const recentTicketsData = tickets
          .sort((a: Ticket, b: Ticket) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setRecentTickets(recentTicketsData);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewTicket = (ticketId: string) => {
    router.push(`/lvm/helpdesk/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    router.push(`/lvm/helpdesk/tickets/${ticketId}/edit`);
  };

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Information Systems Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Helpdesk management and IT support system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
            IS Department
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
              All time tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Currently open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTickets}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">
              Average time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.customerSatisfaction}%</div>
            <p className="text-xs text-muted-foreground">
              Customer rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/helpdesk/reports">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Reports</span>
              </CardTitle>
              <CardDescription>
                View helpdesk analytics and reports
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/team">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <span>Team Management</span>
              </CardTitle>
              <CardDescription>
                Manage IS team members and assignments
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/projects">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <span>IT Projects</span>
              </CardTitle>
              <CardDescription>
                Manage IT projects and initiatives
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/helpdesk/settings">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>System Settings</span>
              </CardTitle>
              <CardDescription>
                Configure system and department settings
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Tickets</CardTitle>
              <CardDescription className="text-sm">
                Latest helpdesk tickets and their status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/lvm/helpdesk/tickets">
                View All
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {recentTickets.length === 0 ? (
              <div className="text-center py-6">
                <Ticket className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No tickets found</p>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer" onClick={() => handleViewTicket(ticket.id)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm truncate hover:text-blue-600">{ticket.title}</p>
                        <span className="text-xs text-gray-400">#{ticket.ticketNumber}</span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Badge 
                      variant={
                        ticket.status === 'RESOLVED' ? 'default' : 
                        ticket.status === 'IN_PROGRESS' ? 'secondary' : 
                        ticket.status === 'PENDING' ? 'outline' : 'destructive'
                      }
                      className="text-xs px-2 py-0.5"
                    >
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                      ticket.priority === 'HIGH' ? 'border-red-200 text-red-700' :
                      ticket.priority === 'MEDIUM' ? 'border-yellow-200 text-yellow-700' :
                      'border-green-200 text-green-700'
                    }`}>
                      {ticket.priority}
                    </Badge>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTicket(ticket.id);
                        }}
                        title="View Ticket"
                      >
                        <Eye className="h-3 w-3 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTicket(ticket.id);
                        }}
                        title="Edit Ticket"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 