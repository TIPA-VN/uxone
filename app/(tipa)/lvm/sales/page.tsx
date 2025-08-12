import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  BarChart3,
  ShoppingCart,
  Phone,
  Mail
} from "lucide-react";

export default function SalesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sales performance, customer management, and revenue tracking
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          SALES Department
        </Badge>
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$847,392</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +18.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">47</div>
            <p className="text-xs text-muted-foreground">
              In pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Active representatives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">23.7%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Pipeline
            </CardTitle>
            <CardDescription>
              Current deals and their stages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Enterprise Software License</span>
              </div>
              <Badge variant="secondary">Closed Won</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Cloud Services Contract</span>
              </div>
              <Badge variant="outline">Negotiation</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Hardware Equipment</span>
              </div>
              <Badge variant="outline">Proposal</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Sales Activities
            </CardTitle>
            <CardDescription>
              Common sales tasks and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Create Lead</div>
              <div className="text-sm text-muted-foreground">Add new potential customer</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Schedule Meeting</div>
              <div className="text-sm text-muted-foreground">Book customer appointments</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Generate Quote</div>
              <div className="text-sm text-muted-foreground">Create price proposals</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Sales Report</div>
              <div className="text-sm text-muted-foreground">View performance metrics</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sales Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Performance
          </CardTitle>
          <CardDescription>
            Key performance indicators and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$2.4M</div>
              <div className="text-sm text-muted-foreground">Q4 Target</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$847K</div>
              <div className="text-sm text-muted-foreground">Current Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">35.3%</div>
              <div className="text-sm text-muted-foreground">Target Achievement</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Sales Activities
          </CardTitle>
          <CardDescription>
            Latest customer interactions and deals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Customer Meeting - ABC Corp</div>
                <div className="text-sm text-muted-foreground">Product demonstration completed</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">Completed</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Quote Sent - XYZ Industries</div>
                <div className="text-sm text-muted-foreground">Enterprise package proposal</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-600">Sent</div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Contract Signed - DEF Solutions</div>
                <div className="text-sm text-muted-foreground">Annual service agreement</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">Closed</div>
                <div className="text-sm text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Sales Performers
          </CardTitle>
          <CardDescription>
            Leading sales representatives this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Sarah Johnson</div>
                <div className="text-sm text-muted-foreground">Senior Sales Executive</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">$156,000</div>
                <div className="text-sm text-muted-foreground">+12% vs last month</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Michael Chen</div>
                <div className="text-sm text-muted-foreground">Account Manager</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">$142,000</div>
                <div className="text-sm text-muted-foreground">+8% vs last month</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Emily Rodriguez</div>
                <div className="text-sm text-muted-foreground">Sales Representative</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">$128,000</div>
                <div className="text-sm text-muted-foreground">+15% vs last month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
