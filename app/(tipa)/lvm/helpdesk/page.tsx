"use client";

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
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function ISHomePage() {
  // Mock data - replace with real data from your API
  const stats = {
    totalTickets: 156,
    openTickets: 23,
    resolvedToday: 8,
    pendingTickets: 5
  };

  const recentTickets = [
    { id: "TKT-001", title: "Network connectivity issue", status: "open", priority: "high", assignedTo: "John Doe" },
    { id: "TKT-002", title: "Software installation request", status: "in-progress", priority: "medium", assignedTo: "Jane Smith" },
    { id: "TKT-003", title: "Password reset", status: "resolved", priority: "low", assignedTo: "Mike Johnson" },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/helpdesk/tickets">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-blue-600" />
                <span>Manage Tickets</span>
              </CardTitle>
              <CardDescription>
                View and manage all helpdesk tickets
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/helpdesk/tickets/new">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-green-600" />
                <span>Create Ticket</span>
              </CardTitle>
              <CardDescription>
                Create a new helpdesk ticket
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

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
          <Link href="/lvm/settings">
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
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>
            Latest helpdesk tickets and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-gray-500">ID: {ticket.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={ticket.status === 'resolved' ? 'default' : 
                           ticket.status === 'in-progress' ? 'secondary' : 'destructive'}
                  >
                    {ticket.status}
                  </Badge>
                  <Badge variant="outline">
                    {ticket.priority}
                  </Badge>
                  <p className="text-sm text-gray-500">{ticket.assignedTo}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/lvm/helpdesk/tickets">
                View All Tickets
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 