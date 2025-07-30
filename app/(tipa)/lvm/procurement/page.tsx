"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Bot,
  Users,
  FileText
} from "lucide-react";

interface ProcurementStats {
  totalPurchaseOrders: number;
  activePurchaseOrders: number;
  totalInventoryItems: number;
  lowStockItems: number;
  totalSpent: number;
  monthlySpending: number;
  costSavings: number;
  supplierCount: number;
  pendingApprovals: number;
  urgentOrders: number;
}

export default function ProcurementDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ProcurementStats>({
    totalPurchaseOrders: 156,
    activePurchaseOrders: 24,
    totalInventoryItems: 1247,
    lowStockItems: 89,
    totalSpent: 2450000,
    monthlySpending: 180000,
    costSavings: 125000,
    supplierCount: 45,
    pendingApprovals: 8,
    urgentOrders: 3,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory' | 'suppliers' | 'ai-insights'>('overview');

  useEffect(() => {
    if (session?.user) {
      setLoading(false);
    }
  }, [session]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading procurement dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Procurement Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          AI-powered procurement management and analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'suppliers', label: 'Suppliers', icon: Users },
            { id: 'ai-insights', label: 'AI Insights', icon: Bot },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active POs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activePurchaseOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Spending</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlySpending)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.costSavings)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Urgent Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  Urgent Alerts
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="text-sm font-medium text-red-800">Pending Approvals</p>
                      <p className="text-xs text-red-600">Purchase orders awaiting approval</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{stats.pendingApprovals}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="text-sm font-medium text-orange-800">Urgent Orders</p>
                      <p className="text-xs text-orange-600">Orders requiring immediate action</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{stats.urgentOrders}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">New PO</span>
                  </button>
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Package className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Check Stock</span>
                  </button>
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Bot className="w-8 h-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">AI Assistant</span>
                  </button>
                  <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className="w-8 h-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {activeTab !== 'overview' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section</h3>
            <p className="text-sm">This section is under development and will be implemented in the next phase.</p>
          </div>
        </div>
      )}
    </div>
  );
} 