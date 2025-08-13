import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, TrendingUp, Users, Target } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Megaphone className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Marketing</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Generation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">New leads this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">8.5%</div>
            <p className="text-xs text-muted-foreground">Lead to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">320%</div>
            <p className="text-xs text-muted-foreground">Marketing ROI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Marketing Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Digital Marketing</p>
                  <p className="text-sm text-blue-700">SEO, PPC, Social Media</p>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">45%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Content Marketing</p>
                  <p className="text-sm text-green-700">Blogs, Whitepapers, Videos</p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">28%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium">Trade Shows</p>
                  <p className="text-sm text-purple-700">Industry events & exhibitions</p>
                </div>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">18%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">Direct Sales</p>
                  <p className="text-sm text-orange-700">Sales team outreach</p>
                </div>
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">9%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="font-medium text-blue-900">New Campaign</p>
                <p className="text-sm text-blue-700">Create marketing campaign</p>
              </button>
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <p className="font-medium text-green-900">Content Calendar</p>
                <p className="text-sm text-green-700">Plan content strategy</p>
              </button>
              <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <p className="font-medium text-purple-900">Analytics Report</p>
                <p className="text-sm text-purple-700">View performance metrics</p>
              </button>
              <button className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <p className="font-medium text-orange-900">Lead Management</p>
                <p className="text-sm text-orange-700">Manage lead pipeline</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Q4 Product Launch</p>
                <p className="text-sm text-gray-600">New motor series introduction</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Industry Conference</p>
                <p className="text-sm text-gray-600">Trade show participation</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Planning</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Customer Success Stories</p>
                <p className="text-sm text-gray-600">Case study development</p>
              </div>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">In Progress</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
