"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users, UserCheck, Calendar, CheckCircle, Clock, AlertTriangle,
  TrendingUp, BarChart3, Target, Activity, Filter, Search,
  ChevronDown, ChevronUp, Eye, User, Award, Star, FileText
} from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  username: string;
  department: string;
  departmentName: string;
  role: string;
  avatar?: string;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    efficiency: number;
  };
  projectStats: {
    total: number;
    completed: number;
    active: number;
    efficiency: number;
  };
};

type TeamKPI = {
  totalMembers: number;
  activeMembers: number;
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  completedProjects: number;
  teamEfficiency: number;
  averageTaskCompletion: number;
  averageProjectCompletion: number;
};

type Project = {
  id: string;
  name: string;
  status: string;
  ownerId: string;
  owner: {
    name: string;
    username: string;
  };
  _count: {
    tasks: number;
    completedTasks: number;
  };
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    username: string;
    department: string;
    departmentName: string;
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
};

const DEPARTMENTS = [
  { value: "logistics", label: "Logistics", color: "bg-blue-500" },
  { value: "procurement", label: "Procurement", color: "bg-green-500" },
  { value: "pc", label: "Production Planning", color: "bg-purple-500" },
  { value: "qa", label: "Quality Assurance", color: "bg-orange-500" },
  { value: "qc", label: "Quality Control", color: "bg-red-500" },
  { value: "pm", label: "Production Maintenance", color: "bg-indigo-500" },
  { value: "fm", label: "Facility Management", color: "bg-yellow-500" },
  { value: "hra", label: "Human Resources", color: "bg-pink-500" },
  { value: "cs", label: "Customer Service", color: "bg-teal-500" },
  { value: "sales", label: "Sales", color: "bg-cyan-500" },
  { value: "LVM-EXPAT", label: "LVM EXPATS", color: "bg-violet-500" },
];

export default function TeamManagementPage() {
  const { data: session } = useSession();
  const user = session?.user;
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamKPI, setTeamKPI] = useState<TeamKPI | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overview' | 'members' | 'projects' | 'tasks'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'efficiency' | 'tasks' | 'projects'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    myTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalHours: 0,
    estimatedHours: 0,
    efficiency: 0,
  });

  // Check if user is a manager
  const isManager = user && ["ADMIN", "SENIOR MANAGER", "MANAGER"].includes(user.role?.toUpperCase() || "");

  useEffect(() => {
    if (user && isManager) {
      fetchTeamData();
    }
  }, [user, isManager]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Fetch team members, projects, and tasks in parallel
      const [membersRes, projectsRes, tasksRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/projects?includeTasks=true'),
        fetch('/api/tasks')
      ]);

      if (!membersRes.ok || !projectsRes.ok || !tasksRes.ok) {
        throw new Error('Failed to fetch team data');
      }

      const [membersData, projectsData, tasksData] = await Promise.all([
        membersRes.json(),
        projectsRes.json(),
        tasksRes.json()
      ]);

      setTeamMembers(membersData || []);
      setProjects(projectsData || []);
      setTasks(tasksData || []);

      // Calculate team KPI
      const kpi = calculateTeamKPI(membersData || [], projectsData || [], tasksData || []);
      setTeamKPI(kpi);

      // Calculate dashboard stats
      const myProjects = (projectsData || []).filter((p: Project) => p.ownerId === user?.id);
      const myTasks = (tasksData || []).filter((t: Task) => t.assigneeId === user?.id);
      
      const totalHours = (tasksData || []).reduce((sum: number, t: Task) => sum + (t.actualHours || 0), 0);
      const estimatedHours = (tasksData || []).reduce((sum: number, t: Task) => sum + (t.estimatedHours || 0), 0);
      const efficiency = estimatedHours > 0 ? Math.round((totalHours / estimatedHours) * 100) : 0;

      setDashboardStats({
        totalProjects: (projectsData || []).length,
        activeProjects: (projectsData || []).filter((p: Project) => p.status === 'ACTIVE').length,
        completedProjects: (projectsData || []).filter((p: Project) => p.status === 'COMPLETED').length,
        totalTasks: (tasksData || []).length,
        myTasks: myTasks.length,
        completedTasks: (tasksData || []).filter((t: Task) => t.status === 'COMPLETED').length,
        overdueTasks: (tasksData || []).filter((t: Task) => {
          if (!t.dueDate || t.status === 'COMPLETED') return false;
          return new Date(t.dueDate) < new Date();
        }).length,
        totalHours,
        estimatedHours,
        efficiency,
      });
    } catch (error) {
      console.error('Error fetching team data:', error);
      // Set empty arrays to prevent further errors
      setTeamMembers([]);
      setProjects([]);
      setTasks([]);
      setTeamKPI(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamKPI = (members: TeamMember[], projects: Project[], tasks: Task[]): TeamKPI => {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.taskStats.total > 0).length;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    
    const teamEfficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const averageTaskCompletion = totalMembers > 0 ? 
      members.reduce((sum, m) => sum + m.taskStats.efficiency, 0) / totalMembers : 0;
    const averageProjectCompletion = totalMembers > 0 ? 
      members.reduce((sum, m) => sum + m.projectStats.efficiency, 0) / totalMembers : 0;

    return {
      totalMembers,
      activeMembers,
      totalTasks,
      completedTasks,
      totalProjects,
      completedProjects,
      teamEfficiency,
      averageTaskCompletion,
      averageProjectCompletion
    };
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
      case "TODO": return "bg-gray-100 text-gray-800 border-gray-200";
      case "BLOCKED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toUpperCase()) {
      case "URGENT": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 75) return "text-blue-600";
    if (efficiency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredMembers = teamMembers
    .filter(member => 
      (filterDepartment === 'all' || member.department === filterDepartment) &&
      (searchTerm === '' || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue, bValue;
      switch(sortBy) {
        case 'efficiency':
          aValue = a.taskStats.efficiency;
          bValue = b.taskStats.efficiency;
          break;
        case 'tasks':
          aValue = a.taskStats.total;
          bValue = b.taskStats.total;
          break;
        case 'projects':
          aValue = a.projectStats.total;
          bValue = b.projectStats.total;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-managers
  if (!isManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need manager privileges to view team management.</p>
          <p className="text-sm text-gray-500">Contact your administrator for access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Team Management
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor team performance, tasks, and project KPIs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">Team Efficiency</p>
                <p className={`text-2xl font-bold ${getEfficiencyColor(teamKPI?.teamEfficiency || 0)}`}>
                  {teamKPI?.teamEfficiency.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: 'dashboard', label: 'My Dashboard', icon: BarChart3 },
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'members', label: 'Team Members', icon: Users },
              { id: 'projects', label: 'Projects', icon: Target },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Personal KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalProjects}</p>
                    <p className="text-xs text-green-600">+{dashboardStats.activeProjects} active</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.myTasks}</p>
                    <p className="text-xs text-green-600">{dashboardStats.completedTasks} completed</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.overdueTasks}</p>
                    <p className="text-xs text-red-600">Need attention</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className={`text-2xl font-bold ${getEfficiencyColor(dashboardStats.efficiency)}`}>
                      {dashboardStats.efficiency}%
                    </p>
                    <p className="text-xs text-gray-600">Time tracking</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Recent Projects</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.filter(p => p.ownerId === user?.id).slice(0, 5).map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                              {project.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{project.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project._count?.completedTasks || 0}/{project._count?.tasks || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${project._count?.tasks > 0 ? ((project._count?.completedTasks || 0) / project._count.tasks) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {project._count?.tasks > 0 ? Math.round(((project._count?.completedTasks || 0) / project._count.tasks) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Recent Tasks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.filter(t => t.assigneeId === user?.id).slice(0, 5).map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.project?.name || 'No Project'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Members</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.totalMembers}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Active Members</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.activeMembers}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Tasks</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.totalTasks}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Completed Tasks</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.completedTasks}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Projects</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.totalProjects}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Completed Projects</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.completedProjects}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Team Efficiency</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.teamEfficiency.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Average Task Completion</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.averageTaskCompletion.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Average Project Completion</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teamKPI?.averageProjectCompletion.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setSortBy(sort as any);
                      setSortOrder(order as any);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="efficiency-desc">Efficiency High-Low</option>
                    <option value="efficiency-asc">Efficiency Low-High</option>
                    <option value="tasks-desc">Tasks High-Low</option>
                    <option value="projects-desc">Projects High-Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Members ({filteredMembers.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">@{member.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              DEPARTMENTS.find(d => d.value === member.department)?.color.replace('bg-', 'bg-').replace('-500', '-100') || 'bg-gray-100'
                            } ${
                              DEPARTMENTS.find(d => d.value === member.department)?.color.replace('bg-', 'text-').replace('-500', '-700') || 'text-gray-700'
                            }`}>
                              {member.departmentName}
                            </span>
                            <span className="text-xs text-gray-500">{member.role}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {/* Task Stats */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{member.taskStats.total}</p>
                          <p className="text-xs text-gray-600">Tasks</p>
                          <p className={`text-xs font-medium ${getEfficiencyColor(member.taskStats.efficiency)}`}>
                            {member.taskStats.efficiency.toFixed(1)}% efficiency
                          </p>
                        </div>
                        
                        {/* Project Stats */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{member.projectStats.total}</p>
                          <p className="text-xs text-gray-600">Projects</p>
                          <p className={`text-xs font-medium ${getEfficiencyColor(member.projectStats.efficiency)}`}>
                            {member.projectStats.efficiency.toFixed(1)}% efficiency
                          </p>
                        </div>
                        
                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {expandedMember === member.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedMember === member.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Task Breakdown */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3">Task Breakdown</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Completed</span>
                                <span className="text-sm font-medium text-green-600">{member.taskStats.completed}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">In Progress</span>
                                <span className="text-sm font-medium text-blue-600">{member.taskStats.inProgress}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Overdue</span>
                                <span className="text-sm font-medium text-red-600">{member.taskStats.overdue}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Project Breakdown */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3">Project Breakdown</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Completed</span>
                                <span className="text-sm font-medium text-green-600">{member.projectStats.completed}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Active</span>
                                <span className="text-sm font-medium text-blue-600">{member.projectStats.active}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Projects</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.owner.name}</div>
                        <div className="text-sm text-gray-500">@{project.owner.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project._count.completedTasks}/{project._count.tasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${project._count.tasks > 0 ? (project._count.completedTasks / project._count.tasks) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {project._count.tasks > 0 ? Math.round((project._count.completedTasks / project._count.tasks) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Tasks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {task.assignee?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">{task.assignee?.name || 'Unassigned'}</div>
                            <div className="text-sm text-gray-500">@{task.assignee?.username || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.project?.name || 'No Project'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 