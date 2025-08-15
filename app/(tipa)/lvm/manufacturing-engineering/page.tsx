'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Settings, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  Plus,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

// Types for real data
interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  _count: {
    tasks: number;
    documents: number;
    comments: number;
    members: number;
  };
  owner: {
    name?: string;
    username: string;
    department?: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee?: {
    name?: string;
    username: string;
  };
  project?: {
    name: string;
  };
}

export default function ManufacturingEngineeringPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects for LVM-ME department
        const projectsResponse = await fetch('/api/projects?includeKPI=true');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          console.log('Projects API Response:', projectsData);
          setProjects(projectsData);
        } else {
          console.error('Projects API Error:', projectsResponse.status, projectsResponse.statusText);
        }

        // Fetch tasks for LVM-ME department
        const tasksResponse = await fetch('/api/tasks');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          console.log('Tasks API Response:', tasksData);
          setTasks(tasksData);
        } else {
          console.error('Tasks API Error:', tasksResponse.status, tasksResponse.statusText);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate real statistics
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'default';
      case 'IN_PROGRESS':
      case 'ACTIVE':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      case 'ON_HOLD':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Manufacturing Engineering data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manufacturing Engineering
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process design, optimization, and engineering support
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          LVM-ME Department
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length > 0 ? `${Math.round((activeProjects / projects.length) * 100)}% of total` : 'No projects yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.length > 0 ? `${Math.round((pendingTasks / tasks.length) * 100)}% of total` : 'No tasks yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedProjects > 0 ? `${Math.round((completedProjects / projects.length) * 100)}% completed` : 'No completed projects'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}% completed` : 'No completed tasks'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Status
              </CardTitle>
              <CardDescription>
                Current engineering projects and their status
              </CardDescription>
            </div>
            <Link href="/lvm/projects">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length > 0 ? (
              projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {project._count.tasks} tasks
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No projects found</p>
                <Link href="/lvm/projects">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Status */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Task Status
              </CardTitle>
              <CardDescription>
                Current engineering tasks and their priority
              </CardDescription>
            </div>
            <Link href="/lvm/tasks">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <span className="font-medium">{task.title}</span>
                      {task.project && (
                        <p className="text-xs text-gray-500">{task.project.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No tasks found</p>
                <Link href="/lvm/tasks">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Debug Information
          </CardTitle>
          <CardDescription>
            Technical details to help diagnose data issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Projects Found:</strong> {projects.length}
            </div>
            <div>
              <strong>Tasks Found:</strong> {tasks.length}
            </div>
            <div>
              <strong>Active Projects:</strong> {activeProjects}
            </div>
            <div>
              <strong>Pending Tasks:</strong> {pendingTasks}
            </div>
          </div>
          
          {/* Session Debug Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Session Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>User Department:</strong> {session?.user?.department || 'Not set'}</div>
              <div><strong>Central Department:</strong> {session?.user?.centralDepartment || 'Not set'}</div>
              <div><strong>User Role:</strong> {session?.user?.role || 'Not set'}</div>
              <div><strong>Username:</strong> {session?.user?.username || 'Not set'}</div>
            </div>
          </div>
          
          {/* API Response Debug */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">API Response Debug</h4>
            <div className="text-sm text-green-800 space-y-1">
              <div><strong>Projects API Status:</strong> {projects.length > 0 ? '✅ Success' : '❌ No data'}</div>
              <div><strong>Tasks API Status:</strong> {tasks.length > 0 ? '✅ Success' : '❌ No data'}</div>
              <div><strong>API Calls Made:</strong> {loading ? '⏳ Loading...' : '✅ Complete'}</div>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {/* Manual API Test */}
            <div className="mt-3 space-y-2">
              <Button 
                onClick={async () => {
                  console.log('🔍 Testing API calls manually...');
                  console.log('Session user department:', session?.user?.department);
                  console.log('Session user centralDepartment:', session?.user?.centralDepartment);
                  
                  try {
                    // Test projects API
                    console.log('📊 Testing Projects API...');
                    const projectsRes = await fetch('/api/projects?includeKPI=true');
                    console.log('Projects API Response Status:', projectsRes.status);
                    if (projectsRes.ok) {
                      const projectsData = await projectsRes.json();
                      console.log('Projects API Data:', projectsData);
                    } else {
                      const error = await projectsRes.json();
                      console.error('Projects API Error:', error);
                    }
                    
                    // Test tasks API
                    console.log('📝 Testing Tasks API...');
                    const tasksRes = await fetch('/api/tasks');
                    console.log('Tasks API Response Status:', tasksRes.status);
                    if (tasksRes.ok) {
                      const tasksData = await tasksRes.json();
                      console.log('Tasks API Data:', tasksData);
                    } else {
                      const error = await tasksRes.json();
                      console.error('Tasks API Error:', error);
                    }
                  } catch (err) {
                    console.error('Manual API test failed:', err);
                  }
                }}
                variant="outline"
                size="sm"
              >
                🔍 Test APIs Manually
              </Button>
              
              <Button 
                onClick={async () => {
                  console.log('🔍 Testing Debug Session Endpoint...');
                  try {
                    const debugRes = await fetch('/api/debug-session');
                    console.log('Debug API Response Status:', debugRes.status);
                    if (debugRes.ok) {
                      const debugData = await debugRes.json();
                      console.log('🔍 Debug Session Data:', debugData);
                      
                      // Show summary in alert
                      alert(`Debug Results:\n\nSession Department: ${debugData.sessionInfo.department}\nTasks Found: ${debugData.tasksQuery.count}\nProjects Found: ${debugData.projectsQuery.count}\n\nCheck console for full details.`);
                    } else {
                      const error = await debugRes.json();
                      console.error('Debug API Error:', error);
                      alert(`Debug API Error: ${error.error || 'Unknown error'}`);
                    }
                  } catch (err) {
                    console.error('Debug API test failed:', err);
                    alert('Debug API test failed. Check console for details.');
                  }
                }}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                🐛 Debug Session
              </Button>
              
              <p className="text-xs text-green-700">
                Click above buttons to manually test the APIs and debug session data
              </p>
            </div>
          </div>
          
          {projects.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>No projects found.</strong> This could mean:
              </p>
              <ul className="list-disc list-inside mt-2 text-yellow-700 text-sm">
                <li>No projects exist in the database yet</li>
                <li>Projects exist but aren&apos;t associated with LVM-ME department</li>
                <li>Database connection issues</li>
                <li>API filtering problems</li>
              </ul>
              <p className="mt-2 text-yellow-700 text-sm">
                Check the browser console for API response details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Lookup Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Lookup Tool
          </CardTitle>
          <CardDescription>
            Look up specific tasks by ID to debug issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter task ID (e.g., cme9mo1p20002lz68i8p54qjm)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="taskLookupInput"
            />
            <Button 
              onClick={async () => {
                const input = document.getElementById('taskLookupInput') as HTMLInputElement;
                const taskId = input.value.trim();
                if (!taskId) return;
                
                try {
                  const response = await fetch(`/api/tasks/${taskId}`);
                  if (response.ok) {
                    const task = await response.json();
                    console.log('Task found:', task);
                    alert(`Task found!\nTitle: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}\nCheck console for full details.`);
                  } else {
                    const error = await response.json();
                    console.error('Task lookup error:', error);
                    alert(`Task not found or error: ${error.error || 'Unknown error'}`);
                  }
                } catch (err) {
                  console.error('Task lookup failed:', err);
                  alert('Failed to lookup task. Check console for details.');
                }
              }}
              variant="outline"
            >
              Lookup Task
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Enter a task ID above and click &quot;Lookup Task&quot; to check if it exists in the database.
            Results will be shown in an alert and logged to the console.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common engineering activities and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/lvm/projects">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <FileText className="h-6 w-6" />
                <span>View Projects</span>
              </Button>
            </Link>
            <Link href="/lvm/tasks">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Wrench className="h-6 w-6" />
                <span>View Tasks</span>
              </Button>
            </Link>
            <Link href="/lvm/team">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span>Team Management</span>
              </Button>
            </Link>
            <Link href="/lvm/dashboard">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Engineering Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engineering Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators and benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {projects.length > 0 ? Math.round((activeProjects / projects.length) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Project Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Task Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {projects.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Active Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
