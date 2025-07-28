"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Clock,
  XCircle,
  Shield
} from "lucide-react";
import Link from "next/link";

export default function QCHomePage() {
  // Mock data - replace with real data from your API
  const stats = {
    totalInspections: 89,
    passedInspections: 76,
    failedInspections: 8,
    pendingInspections: 5
  };

  const recentInspections = [
    { id: "QC-001", product: "Product A", status: "passed", inspector: "John Doe", date: "2025-01-27" },
    { id: "QC-002", product: "Product B", status: "failed", inspector: "Jane Smith", date: "2025-01-27" },
    { id: "QC-003", product: "Product C", status: "pending", inspector: "Mike Johnson", date: "2025-01-27" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Quality inspection and control management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            QC Department
          </Badge>
          <Button asChild>
            <Link href="/lvm/quality-control/inspections/new">
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInspections}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passedInspections}</div>
            <p className="text-xs text-muted-foreground">
              Quality approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedInspections}</div>
            <p className="text-xs text-muted-foreground">
              Quality issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingInspections}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting inspection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/quality-control/inspections">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Inspections</span>
              </CardTitle>
              <CardDescription>
                Manage quality inspections and reports
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/quality-control/inspections/new">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <span>New Inspection</span>
              </CardTitle>
              <CardDescription>
                Create a new quality inspection
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/quality-control/reports">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Quality Reports</span>
              </CardTitle>
              <CardDescription>
                View quality analytics and reports
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/quality-control/standards">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <span>Quality Standards</span>
              </CardTitle>
              <CardDescription>
                Manage quality standards and criteria
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/quality-control/issues">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Quality Issues</span>
              </CardTitle>
              <CardDescription>
                Track and resolve quality issues
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/lvm/settings">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>QC Settings</span>
              </CardTitle>
              <CardDescription>
                Configure quality control settings
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
          <CardDescription>
            Latest quality inspections and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInspections.map((inspection) => (
              <div key={inspection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{inspection.product}</p>
                    <p className="text-sm text-gray-500">ID: {inspection.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={inspection.status === 'passed' ? 'default' : 
                           inspection.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {inspection.status}
                  </Badge>
                  <p className="text-sm text-gray-500">{inspection.inspector}</p>
                  <p className="text-sm text-gray-500">{inspection.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/lvm/quality-control/inspections">
                View All Inspections
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 