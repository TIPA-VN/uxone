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
  Calculator,
  PieChart
} from "lucide-react";

export default function AccountingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Accounting Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Financial management, reporting, and accounting operations
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          ACC Department
        </Badge>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$2,847,392</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">$1,923,847</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              +5.7% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$923,545</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-blue-600" />
              +18.9% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Require review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Status
            </CardTitle>
            <CardDescription>
              Key financial metrics and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Monthly Close</span>
              </div>
              <Badge variant="secondary">Completed</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Budget Review</span>
              </div>
              <Badge variant="outline">Due Today</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Audit Preparation</span>
              </div>
              <Badge variant="outline">In Progress</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Accounting Tasks
            </CardTitle>
            <CardDescription>
              Common financial activities and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Process Invoices</div>
              <div className="text-sm text-muted-foreground">Review and approve vendor invoices</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Generate Reports</div>
              <div className="text-sm text-muted-foreground">Create financial statements</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Budget Review</div>
              <div className="text-sm text-muted-foreground">Analyze budget vs actual</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Reconciliation</div>
              <div className="text-sm text-muted-foreground">Bank and account reconciliation</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>
            Latest financial activities and entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Vendor Payment - ABC Supplies</div>
                <div className="text-sm text-muted-foreground">Invoice #INV-2024-001</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">-$12,450.00</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Customer Payment - XYZ Corp</div>
                <div className="text-sm text-muted-foreground">Invoice #INV-2024-156</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">+$28,750.00</div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Equipment Purchase</div>
                <div className="text-sm text-muted-foreground">Production Line Upgrade</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">-$45,200.00</div>
                <div className="text-sm text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
