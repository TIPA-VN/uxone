import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Truck,
  Warehouse
} from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stock control, warehouse management, and inventory operations
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          INV Department
        </Badge>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +23 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$4,293,847</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-blue-600" />
              +8.7% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">47</div>
            <p className="text-xs text-muted-foreground">
              Require reorder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Inventory Status
            </CardTitle>
            <CardDescription>
              Current stock levels and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Raw Materials</span>
              </div>
              <Badge variant="secondary">Optimal</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Finished Goods</span>
              </div>
              <Badge variant="outline">Low Stock</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium">Packaging</span>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Tasks
            </CardTitle>
            <CardDescription>
              Common inventory management activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Stock Count</div>
              <div className="text-sm text-muted-foreground">Perform physical inventory count</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Reorder Items</div>
              <div className="text-sm text-muted-foreground">Create purchase orders for low stock</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Receive Goods</div>
              <div className="text-sm text-muted-foreground">Process incoming shipments</div>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="font-medium">Transfer Stock</div>
              <div className="text-sm text-muted-foreground">Move items between locations</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Latest inventory transactions and movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Received Shipment - ABC Supplies</div>
                <div className="text-sm text-muted-foreground">PO-2024-001 • 500 units</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">+500</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Production Issue - Line A-1</div>
                <div className="text-sm text-muted-foreground">Raw Material X • 200 units</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">-200</div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Customer Order - XYZ Corp</div>
                <div className="text-sm text-muted-foreground">Product Y-2000 • 150 units</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">-150</div>
                <div className="text-sm text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Locations
          </CardTitle>
          <CardDescription>
            Stock distribution across warehouse zones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Zone A</div>
              <div className="text-sm text-muted-foreground">Raw Materials</div>
              <div className="text-lg font-semibold">1,247 SKUs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Zone B</div>
              <div className="text-sm text-muted-foreground">Work in Progress</div>
              <div className="text-lg font-semibold">892 SKUs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">Zone C</div>
              <div className="text-sm text-muted-foreground">Finished Goods</div>
              <div className="text-lg font-semibold">708 SKUs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
