import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Lightbulb, TrendingUp, Target } from 'lucide-react';

export default function ResearchDevelopmentPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <FlaskConical className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Research & Development</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Ongoing research</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Innovations</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">76%</div>
            <p className="text-xs text-muted-foreground">Project success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patents</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Filed patents</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Research Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Electric Motor Technology</p>
                  <p className="text-sm text-blue-700">Advanced motor design research</p>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Energy Efficiency</p>
                  <p className="text-sm text-green-700">Power consumption optimization</p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium">Material Science</p>
                  <p className="text-sm text-purple-700">New material development</p>
                </div>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Planning</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">Automation Systems</p>
                  <p className="text-sm text-orange-700">Smart manufacturing research</p>
                </div>
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Active</span>
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
                <p className="font-medium text-blue-900">New Research Project</p>
                <p className="text-sm text-blue-700">Create research proposal</p>
              </button>
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <p className="font-medium text-green-900">Lab Resources</p>
                <p className="text-sm text-green-700">Manage lab equipment</p>
              </button>
              <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <p className="font-medium text-purple-900">Collaborations</p>
                <p className="text-sm text-purple-700">Academic partnerships</p>
              </button>
              <button className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <p className="font-medium text-orange-900">Publications</p>
                <p className="text-sm text-orange-700">Research papers & reports</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Breakthroughs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">High-Efficiency Motor Design</p>
                <p className="text-sm text-gray-600">Achieved 95% efficiency in new prototype</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Completed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Smart Material Development</p>
                <p className="text-sm text-gray-600">New composite material for motor housing</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">In Progress</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Energy Management System</p>
                <p className="text-sm text-gray-600">AI-powered energy optimization</p>
              </div>
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Testing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
