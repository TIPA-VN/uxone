"use client";

import { useState, useEffect } from "react";
import { getRoles, getDepartments } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Filter,
  ArrowLeft,
  Download,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface PermissionAudit {
  role: string;
  permissions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  lastAccessed?: string;
  userCount: number;
}

interface SecurityInsight {
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  severity: number;
}

export default function PermissionsAuditPage() {
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [auditData, setAuditData] = useState<PermissionAudit[]>([]);
  const [insights, setInsights] = useState<SecurityInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateAuditData();
  }, []);

  const generateAuditData = () => {
    setIsLoading(true);
    
    // Simulate audit data generation
    setTimeout(() => {
      const roles = getRoles();
      const rolesArray = Object.values(roles);
      const auditData: PermissionAudit[] = rolesArray.map(role => ({
        role: role.label,
        permissions: role.permissions || [],
        riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        userCount: Math.floor(Math.random() * 50) + 1
      }));

      const securityInsights: SecurityInsight[] = [
        {
          type: 'warning',
          message: '3 roles have excessive permissions that may pose security risks',
          severity: 7
        },
        {
          type: 'info',
          message: '15 users have not accessed the system in 30+ days',
          severity: 4
        },
        {
          type: 'success',
          message: 'All critical operations require dual approval',
          severity: 2
        },
        {
          type: 'error',
          message: '1 role has conflicting permissions that may cause access issues',
          severity: 9
        }
      ];

      setAuditData(auditData);
      setInsights(securityInsights);
      setIsLoading(false);
    }, 1000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const filteredAuditData = auditData.filter(item => {
    if (selectedRole !== "all" && item.role !== selectedRole) return false;
    if (selectedDepartment !== "all") {
      // Filter by department logic here
      return true;
    }
    return true;
  });

  const exportAuditReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Role,Permissions,Risk Level,Last Accessed,User Count\n"
      + filteredAuditData.map(item => 
          `${item.role},"${item.permissions.join('; ')}",${item.riskLevel},${item.lastAccessed},${item.userCount}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "permissions_audit_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Generating audit report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/rbac" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to RBAC
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Permissions Audit</h1>
          <p className="text-gray-600">Comprehensive security analysis and risk assessment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAuditData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAuditReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{insight.message}</p>
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(insight.severity / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{insight.severity}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Audit Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.values(getRoles()).map(role => (
                    <SelectItem key={role.value} value={role.label}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {getDepartments().map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Audit Results
          </CardTitle>
          <CardDescription>
            {filteredAuditData.length} roles analyzed • Last updated: {new Date().toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAuditData.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">{item.role}</h3>
                    <Badge className={getRiskColor(item.riskLevel)}>
                      {item.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.userCount} users
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions ({item.permissions.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {item.permissions.slice(0, 5).map((permission, pIndex) => (
                        <Badge key={pIndex} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {item.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Activity</h4>
                    <p className="text-sm text-gray-600">
                      Last accessed: {item.lastAccessed ? new Date(item.lastAccessed).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{auditData.length}</div>
            <p className="text-xs text-gray-500">Active roles in system</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">High Risk Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditData.filter(item => item.riskLevel === 'high').length}
            </div>
            <p className="text-xs text-gray-500">Requires immediate attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {auditData.reduce((sum, item) => sum + item.userCount, 0)}
            </div>
            <p className="text-xs text-gray-500">Across all roles</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
