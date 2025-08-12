import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Factory, 
  Settings, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function ManufacturingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manufacturing Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage manufacturing operations, production schedules, and equipment
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          MFG Department
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Production Lines</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff on Shift</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Current shift
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Maintenance</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Production Status
            </CardTitle>
            <CardDescription>
              Current production line status and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Line A-1</span>
              </div>
              <Badge variant="secondary">Running</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Line B-3</span>
              </div>
              <Badge variant="outline">Setup</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium">Line C-2</span>
              </div>
              <Badge variant="destructive">Stopped</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common manufacturing tasks and operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Start Production Line</div>
              <div className="text-sm text-muted-foreground">Initialize new production run</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Schedule Maintenance</div>
              <div className="text-sm text-muted-foreground">Plan equipment maintenance</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Quality Check</div>
              <div className="text-sm text-muted-foreground">Perform quality inspection</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Inventory Review</div>
              <div className="text-sm text-muted-foreground">Check material levels</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Schedule
          </CardTitle>
          <CardDescription>
            Production schedule for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Product X-1000</div>
                <div className="text-sm text-muted-foreground">Line A-1 • 500 units</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Tomorrow</div>
                <div className="text-sm text-muted-foreground">8:00 AM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Product Y-2000</div>
                <div className="text-sm text-muted-foreground">Line B-3 • 300 units</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Wednesday</div>
                <div className="text-sm text-muted-foreground">2:00 PM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
