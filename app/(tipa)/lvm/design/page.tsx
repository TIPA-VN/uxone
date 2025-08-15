import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  Settings, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  BarChart3,
  HardHat,
  Zap,
  Lightbulb,
  Cog
} from "lucide-react";

export default function DesignPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            LVM Design
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Product design, engineering, and production optimization
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          LVM-DESIGN Department
        </Badge>
      </div>

      {/* Engineering Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">
              In development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Design Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">89.4%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engineering Team</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Product engineers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prototypes</CardTitle>
            <Cog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              In testing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Project Status
            </CardTitle>
            <CardDescription>
              Current engineering projects and their progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Automated Assembly Line</span>
              </div>
              <Badge variant="secondary">Design Complete</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Quality Control System</span>
              </div>
              <Badge variant="outline">Prototype Phase</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Material Handling Robot</span>
              </div>
              <Badge variant="outline">Concept Review</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Engineering Tasks
            </CardTitle>
            <CardDescription>
              Common product engineering activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Design Review</div>
              <div className="text-sm text-muted-foreground">Review engineering drawings</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Prototype Testing</div>
              <div className="text-sm text-muted-foreground">Test new product designs</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Production Planning</div>
              <div className="text-sm text-muted-foreground">Plan manufacturing processes</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Quality Standards</div>
              <div className="text-sm text-muted-foreground">Define product specifications</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Engineering Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engineering Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators and benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">18.7</div>
              <div className="text-sm text-muted-foreground">Avg. Project Duration (days)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">92.1%</div>
              <div className="text-sm text-muted-foreground">Design Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">8.7</div>
              <div className="text-sm text-muted-foreground">Customer Satisfaction Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Engineering Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Engineering Activities
          </CardTitle>
          <CardDescription>
            Latest design and development activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Design Review - Assembly Line</div>
                <div className="text-sm text-muted-foreground">Automation system approved</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">Approved</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Prototype Test - QC System</div>
                <div className="text-sm text-muted-foreground">Initial testing completed</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-600">Testing</div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Concept Design - Robot</div>
                <div className="text-sm text-muted-foreground">Material handling system</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-yellow-600">In Review</div>
                <div className="text-sm text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Engineering Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Engineering Schedule
          </CardTitle>
          <CardDescription>
            Planned engineering activities for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Design Review Meeting</div>
                <div className="text-sm text-muted-foreground">New product line concepts</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Tomorrow</div>
                <div className="text-sm text-muted-foreground">10:00 AM - 12:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Prototype Testing</div>
                <div className="text-sm text-muted-foreground">Quality control automation</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Wednesday</div>
                <div className="text-sm text-muted-foreground">2:00 PM - 5:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Engineering Workshop</div>
                <div className="text-sm text-muted-foreground">Process optimization techniques</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Friday</div>
                <div className="text-sm text-muted-foreground">9:00 AM - 4:00 PM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
