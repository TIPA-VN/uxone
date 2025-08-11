'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  TrendingUp,
  FileText,
  BarChart3,
  Headphones,
  Bot,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import MetricCard from '@/components/cs/MetricCard';
import InfoCard from '@/components/cs/InfoCard';

interface CustomerServiceStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  activeAgents: number;
  totalCustomers: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  customer: string;
  assignedTo: string;
  createdAt: string;
}

interface TeamMember {
  name: string;
  role: string;
  status: 'Online' | 'Break' | 'Training' | 'Offline';
  tickets: number;
  avatar: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'cs-agent',
    title: 'CS Agent',
    description: 'AI-powered customer service assistant',
    icon: Bot,
    path: '/chat/cs-chatbox',
    color: 'bg-blue-500'
  },
  {
    id: 'tickets',
    title: 'Manage Tickets',
    description: 'View and manage customer support tickets',
    icon: MessageSquare,
    path: '/lvm/helpdesk',
    color: 'bg-green-500'
  },
  {
    id: 'customers',
    title: 'Customer Database',
    description: 'Access customer information and history',
    icon: Users,
    path: '/lvm/customers',
    color: 'bg-purple-500'
  },
  {
    id: 'knowledge',
    title: 'Knowledge Base',
    description: 'Manage support articles and FAQs',
    icon: FileText,
    path: '/lvm/knowledge-base',
    color: 'bg-orange-500'
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'View performance metrics and reports',
    icon: BarChart3,
    path: '/lvm/reports',
    color: 'bg-teal-500'
  },
  {
    id: 'team',
    title: 'Team Management',
    description: 'Manage CS team and assignments',
    icon: Users,
    path: '/lvm/team',
    color: 'bg-indigo-500'
  }
];

const mockTickets: Ticket[] = [
  { id: 'TKT-001', title: 'Login issue with mobile app', status: 'open', priority: 'high', customer: 'ABC Corp', assignedTo: 'Sarah Johnson', createdAt: '2 hours ago' },
  { id: 'TKT-002', title: 'Billing question about subscription', status: 'pending', priority: 'medium', customer: 'XYZ Ltd', assignedTo: 'Mike Chen', createdAt: '4 hours ago' },
  { id: 'TKT-003', title: 'Feature request for dashboard', status: 'resolved', priority: 'low', customer: 'Global Inc', assignedTo: 'Emily Davis', createdAt: '1 day ago' },
  { id: 'TKT-004', title: 'Payment processing issue', status: 'open', priority: 'high', customer: 'Tech Solutions', assignedTo: 'David Wilson', createdAt: '3 hours ago' }
];

const mockTeamMembers: TeamMember[] = [
  { name: 'Sarah Johnson', role: 'Team Lead', status: 'Online', tickets: 8, avatar: 'SJ' },
  { name: 'Mike Chen', role: 'Senior Agent', status: 'Online', tickets: 12, avatar: 'MC' },
  { name: 'Emily Davis', role: 'Agent', status: 'Break', tickets: 5, avatar: 'ED' },
  { name: 'David Wilson', role: 'Agent', status: 'Online', tickets: 9, avatar: 'DW' },
  { name: 'Lisa Brown', role: 'Agent', status: 'Training', tickets: 0, avatar: 'LB' },
  { name: 'Tom Anderson', role: 'Agent', status: 'Online', tickets: 7, avatar: 'TA' }
];

export default function CustomerServiceHomePage() {
  const [stats, setStats] = useState<CustomerServiceStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    activeAgents: 0,
    totalCustomers: 0
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Simulate loading stats - in real app, fetch from API
    const timer = setTimeout(() => {
      setStats({
        totalTickets: 156,
        openTickets: 23,
        resolvedTickets: 128,
        pendingTickets: 5,
        averageResponseTime: 2.4,
        customerSatisfaction: 4.6,
        activeAgents: 8,
        totalCustomers: 342
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleQuickAction = (path: string) => {
    if (path.startsWith('/chat/cs-chatbox')) {
      // Open CS Agent in popup
      const popup = window.open(path, 'cs_agent_popup', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (popup) popup.focus();
    } else {
      // Navigate to other paths
      window.location.href = path;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Online': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'Break': return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'Training': return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Headphones className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Customer Service Department
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Excellence in customer care and support
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Tickets"
            value={stats.totalTickets.toString()}
            isDarkMode={isDarkMode}
          />
          <MetricCard
            label="Open Tickets"
            value={stats.openTickets.toString()}
            isDarkMode={isDarkMode}
          />
          <MetricCard
            label="Avg Response Time"
            value={`${stats.averageResponseTime}h`}
            isDarkMode={isDarkMode}
          />
          <MetricCard
            label="Customer Satisfaction"
            value={`${stats.customerSatisfaction}/5.0`}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Key performance indicators for the CS team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ticket Resolution Rate</span>
                    <Badge variant="secondary">94.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">First Response SLA</span>
                    <Badge variant="secondary">98.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Retention</span>
                    <Badge variant="secondary">96.8%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Team Efficiency</span>
                    <Badge variant="secondary">87.3%</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tickets */}
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <MessageSquare className="h-5 w-5" />
                      Recent Tickets
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <CardDescription>Latest customer support requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockTickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{ticket.id} • {ticket.customer}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                content="Our Customer Service team is available 24/7 to provide exceptional support. We maintain an average response time of under 3 hours and achieve 95% customer satisfaction rates."
                isDarkMode={isDarkMode}
                title="Service Excellence"
              />
              <InfoCard
                content="We handle over 500 customer interactions monthly, including technical support, order inquiries, and product information requests. Our team is trained in multiple product lines and industry best practices."
                isDarkMode={isDarkMode}
                title="Team Capabilities"
              />
            </div>
          </TabsContent>

          <TabsContent value="quick-actions" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Quick Actions</CardTitle>
                <CardDescription>Access frequently used customer service tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-3 hover:shadow-md transition-all border-0 bg-white dark:bg-slate-700"
                        onClick={() => handleQuickAction(action.path)}
                      >
                        <div className={`p-3 rounded-lg ${action.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{action.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Support Tickets
              </h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
            
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute ml-3 mt-3" />
                    <input
                      id="ticket-search"
                      name="ticket-search"
                      type="text"
                      placeholder="Search tickets..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {mockTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {ticket.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {ticket.customer} • Assigned to {ticket.assignedTo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          {ticket.createdAt}
                        </p>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">CS Team Overview</CardTitle>
                <CardDescription>Current team members and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockTeamMembers.map((member, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">
                            {member.avatar}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{member.role}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(member.status)}
                          <Badge 
                            variant={member.status === 'Online' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {member.tickets} tickets
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Recent Activity</CardTitle>
                <CardDescription>Latest customer service activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Ticket resolved', details: 'TKT-003 resolved by Sarah Johnson', time: '2 hours ago', type: 'success' },
                    { action: 'New ticket created', details: 'TKT-004: Payment processing issue', time: '3 hours ago', type: 'info' },
                    { action: 'Customer feedback', details: '5-star rating received for TKT-002', time: '4 hours ago', type: 'success' },
                    { action: 'Team meeting', details: 'Weekly CS team standup completed', time: '6 hours ago', type: 'info' },
                    { action: 'Knowledge base updated', details: 'FAQ article on login issues updated', time: '1 day ago', type: 'info' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-700/50">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{activity.details}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
