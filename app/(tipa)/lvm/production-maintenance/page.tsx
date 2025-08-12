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
  HardHat,
  Zap
} from "lucide-react";

export default function ProductionMaintenancePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Production Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Equipment maintenance, preventive care, and technical support
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          PM Department
        </Badge>
      </div>

      {/* Maintenance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Staff</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Available technicians
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled PM</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
        {/* Work Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Work Order Status
            </CardTitle>
            <CardDescription>
              Current maintenance tasks and their status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Line A-1 Motor Repair</span>
              </div>
              <Badge variant="secondary">In Progress</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Conveyor Belt Replacement</span>
              </div>
              <Badge variant="outline">Scheduled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Hydraulic System Check</span>
              </div>
              <Badge variant="outline">Pending Parts</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Maintenance Tasks
            </CardTitle>
            <CardDescription>
              Common maintenance activities and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Create Work Order</div>
              <div className="text-sm text-muted-foreground">Generate new maintenance request</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Schedule PM</div>
              <div className="text-sm text-muted-foreground">Plan preventive maintenance</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Parts Inventory</div>
              <div className="text-sm text-muted-foreground">Check spare parts availability</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Equipment History</div>
              <div className="text-sm text-muted-foreground">View maintenance records</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Equipment Health Status
          </CardTitle>
          <CardDescription>
            Current condition of production equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Optimal</div>
              <div className="text-sm text-muted-foreground">15 Equipment</div>
              <div className="text-lg font-semibold">94.2%</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">Attention</div>
              <div className="text-sm text-muted-foreground">3 Equipment</div>
              <div className="text-lg font-semibold">4.8%</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">Critical</div>
              <div className="text-sm text-muted-foreground">1 Equipment</div>
              <div className="text-lg font-semibold">1.0%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Maintenance Schedule
          </CardTitle>
          <CardDescription>
            Scheduled maintenance for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Line B-3 Preventive Maintenance</div>
                <div className="text-sm text-muted-foreground">Routine inspection and lubrication</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Tomorrow</div>
                <div className="text-sm text-muted-foreground">8:00 AM - 12:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Compressor System Check</div>
                <div className="text-sm text-muted-foreground">Air pressure and filter inspection</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Wednesday</div>
                <div className="text-sm text-muted-foreground">2:00 PM - 4:00 PM</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Safety System Test</div>
                <div className="text-sm text-muted-foreground">Emergency stop and safety protocols</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Friday</div>
                <div className="text-sm text-muted-foreground">10:00 AM - 11:00 AM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
