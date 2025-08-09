'use client';

import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  // Users,
  MessageSquare,
  // Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReportData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  ticketsByStatus: {
    status: string;
    count: number;
  }[];
  ticketsByPriority: {
    priority: string;
    count: number;
  }[];
  ticketsByCategory: {
    category: string;
    count: number;
  }[];
  ticketsByMonth: {
    month: string;
    count: number;
  }[];
  topAssignees: {
    name: string;
    count: number;
  }[];
}

export default function ReportsPage() {
  // const { data: session } = useSession();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tickets/reports?timeRange=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [timeRange]);

  const exportReport = () => {
    // Implementation for exporting report data
    console.log('Exporting report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
        <p className="text-gray-600">No report data is currently available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Helpdesk Reports</h1>
          <p className="text-gray-600">Analytics and insights for support tickets</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              All time tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reportData.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Currently open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reportData.averageResolutionTime}h
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.ticketsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === 'OPEN' && <Clock className="w-4 h-4 text-blue-600" />}
                    {item.status === 'IN_PROGRESS' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                    {item.status === 'RESOLVED' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {item.status === 'CLOSED' && <XCircle className="w-4 h-4 text-gray-600" />}
                    <span className="text-sm font-medium">{item.status.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.ticketsByPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.priority}</span>
                  <Badge 
                    variant={item.priority === 'URGENT' ? 'destructive' : 'secondary'}
                  >
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.ticketsByCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.category}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Assignees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Assignees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topAssignees.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    {index < 3 && (
                      <Badge variant="default" className="text-xs">
                        #{index + 1}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{item.count} tickets</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Ticket Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {reportData.ticketsByMonth.map((item) => (
              <div key={item.month} className="text-center">
                <div className="text-lg font-bold">{item.count}</div>
                <div className="text-xs text-gray-500">{item.month}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
