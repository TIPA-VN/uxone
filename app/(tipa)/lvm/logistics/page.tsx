'use client';
import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  FileText, 
  BarChart3, 
  MapPin, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import InvoiceChecker from '@/components/logistics/InvoiceChecker';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: number;
}

interface QuickActionCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  onClick?: () => void;
}

interface Shipment {
  id: string;
  customer: string;
  status: string;
  date: string;
  amount: number;
}

interface ShipmentRowProps {
  shipment: Shipment;
}

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for logistics dashboard
  const stats = {
    shipments: 156,
    pending: 23,
    delivered: 133,
    revenue: 284750,
    customers: 45,
    routes: 12
  };

  const recentShipments = [
    { id: 'SH001', customer: 'TIC-LVM', status: 'Delivered', date: '2025-01-27', amount: 12500 },
    { id: 'SH002', customer: 'TIPS-LVM', status: 'In Transit', date: '2025-01-26', amount: 8900 },
    { id: 'SH003', customer: 'NGOCTIEN-LVM', status: 'Pending', date: '2025-01-25', amount: 5600 },
    { id: 'SH004', customer: 'TIPSH-LVM', status: 'Delivered', date: '2025-01-24', amount: 7800 },
  ];

  const quickActions = [
    { title: 'Invoice Checker', icon: FileText, color: 'bg-blue-500', description: 'Verify tax invoices' },
    { title: 'Shipment Tracker', icon: Truck, color: 'bg-green-500', description: 'Track deliveries' },
    { title: 'Route Planner', icon: MapPin, color: 'bg-purple-500', description: 'Optimize routes' },
    { title: 'Cost Analysis', icon: BarChart3, color: 'bg-orange-500', description: 'Financial reports' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, change }: StatCardProps) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, icon: Icon, color, description, onClick }: QuickActionCardProps) => (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
    >
      <div className={`p-3 rounded-lg ${color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="flex items-center text-blue-600 text-sm font-medium">
        Open <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );

  const ShipmentRow = ({ shipment }: ShipmentRowProps) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${
          shipment.status === 'Delivered' ? 'bg-green-100' :
          shipment.status === 'In Transit' ? 'bg-blue-100' : 'bg-yellow-100'
        }`}>
          {shipment.status === 'Delivered' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : shipment.status === 'In Transit' ? (
            <Truck className="w-5 h-5 text-blue-600" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{shipment.id}</p>
          <p className="text-sm text-gray-600">{shipment.customer}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">${shipment.amount.toLocaleString()}</p>
        <p className="text-sm text-gray-600">{shipment.date}</p>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
        shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {shipment.status}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Logistics Dashboard</h1>
                <p className="text-sm text-gray-600">Manage shipments, invoices, and logistics operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Shipment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'invoices', label: 'Invoice Checker', icon: FileText },
              { id: 'shipments', label: 'Shipments', icon: Package },
              { id: 'routes', label: 'Routes', icon: MapPin },
              { id: 'reports', label: 'Reports', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Shipments"
                value={stats.shipments}
                icon={Package}
                color="bg-blue-500"
                change={12}
              />
              <StatCard
                title="Pending Deliveries"
                value={stats.pending}
                icon={Clock}
                color="bg-yellow-500"
                change={-5}
              />
              <StatCard
                title="Delivered"
                value={stats.delivered}
                icon={CheckCircle}
                color="bg-green-500"
                change={8}
              />
              <StatCard
                title="Revenue"
                value={`$${stats.revenue.toLocaleString()}`}
                icon={DollarSign}
                color="bg-purple-500"
                change={15}
              />
              <StatCard
                title="Active Customers"
                value={stats.customers}
                icon={Users}
                color="bg-indigo-500"
                change={3}
              />
              <StatCard
                title="Active Routes"
                value={stats.routes}
                icon={MapPin}
                color="bg-orange-500"
                change={0}
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, index) => (
                  <QuickActionCard
                    key={index}
                    {...action}
                    onClick={() => setActiveTab(action.title.toLowerCase().replace(' ', ''))}
                  />
                ))}
              </div>
            </div>

            {/* Recent Shipments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentShipments.map((shipment) => (
                  <ShipmentRow key={shipment.id} shipment={shipment} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Invoice Management</h2>
                  <p className="text-sm text-gray-600">Verify and manage tax invoices with VNPT system</p>
                </div>
              </div>
              <InvoiceChecker />
            </div>
          </div>
        )}

        {activeTab === 'shipments' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipment Management</h2>
            <p className="text-gray-600">Shipment tracking and management features coming soon...</p>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Planning</h2>
            <p className="text-gray-600">Route optimization and planning features coming soon...</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports & Analytics</h2>
            <p className="text-gray-600">Comprehensive reporting and analytics features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
