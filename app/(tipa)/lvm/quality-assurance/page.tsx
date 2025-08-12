import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle,
  Clock,
  FileText,
  Target,
  BarChart3,
  Shield,
  TestTube
} from "lucide-react";

export default function QualityAssurancePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quality Assurance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing, validation, and quality control processes
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          QA Department
        </Badge>
      </div>

      {/* QA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              Total test cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">96.8%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Active testers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Test Execution Status
            </CardTitle>
            <CardDescription>
              Current testing activities and results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">User Authentication Tests</span>
              </div>
              <Badge variant="secondary">Passed</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Performance Tests</span>
              </div>
              <Badge variant="outline">Running</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Integration Tests</span>
              </div>
              <Badge variant="outline">In Progress</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              QA Activities
            </CardTitle>
            <CardDescription>
              Common quality assurance tasks and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Create Test Plan</div>
              <div className="text-sm text-muted-foreground">Develop new testing strategy</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Execute Tests</div>
              <div className="text-sm text-muted-foreground">Run automated and manual tests</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Bug Reporting</div>
              <div className="text-sm text-muted-foreground">Document and track issues</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Quality Metrics</div>
              <div className="text-sm text-muted-foreground">View performance indicators</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quality Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators and benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98.2%</div>
              <div className="text-sm text-muted-foreground">Code Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">96.8%</div>
              <div className="text-sm text-muted-foreground">Test Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">2.3</div>
              <div className="text-sm text-muted-foreground">Avg. Bug Severity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Test Results
          </CardTitle>
          <CardDescription>
            Latest testing outcomes and findings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">API Endpoint Tests</div>
                <div className="text-sm text-muted-foreground">User Management Module</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">Passed</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">UI Component Tests</div>
                <div className="text-sm text-muted-foreground">Dashboard Interface</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">Failed</div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Database Tests</div>
                <div className="text-sm text-muted-foreground">Data Integrity Checks</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">Passed</div>
                <div className="text-sm text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Testing Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Testing Schedule
          </CardTitle>
          <CardDescription>
            Planned testing activities for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Regression Testing</div>
                <div className="text-sm text-muted-foreground">Version 2.1.0 Release</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Tomorrow</div>
                <div className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Security Testing</div>
                <div className="text-sm text-muted-foreground">Penetration Testing</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Wednesday</div>
                <div className="text-sm text-muted-foreground">10:00 AM - 3:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Performance Testing</div>
                <div className="text-sm text-muted-foreground">Load Testing Suite</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Friday</div>
                <div className="text-sm text-muted-foreground">1:00 PM - 6:00 PM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
