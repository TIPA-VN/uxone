import { DEPARTMENTS } from '../types/project';
import { canAccessProjectTab, canAccessDepartmentTab } from '@/lib/rbac';

interface ProjectTabsProps {
  departments: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: {
    id: string;
    role?: string;
    department?: string;
  } | undefined;
  projectOwnerId: string;
}

export function ProjectTabs({ departments, activeTab, onTabChange, user, projectOwnerId }: ProjectTabsProps) {
  const getTabColor = (dept: string, active: boolean) => {
    switch(dept) {
      case 'logistics': return active
        ? 'bg-emerald-500 text-white border-emerald-600'
        : 'border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100';
      case 'procurement': return active
        ? 'bg-blue-500 text-white border-blue-600'
        : 'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100';
      case 'pc': return active
        ? 'bg-sky-500 text-white border-sky-600'
        : 'border-sky-500 text-sky-600 bg-sky-50 hover:bg-sky-100';
      case 'qa': return active
        ? 'bg-teal-500 text-white border-teal-600'
        : 'border-teal-500 text-teal-600 bg-teal-50 hover:bg-teal-100';
      case 'qc': return active
        ? 'bg-cyan-500 text-white border-cyan-600'
        : 'border-cyan-500 text-cyan-600 bg-cyan-50 hover:bg-cyan-100';
      case 'pm': return active
        ? 'bg-indigo-500 text-white border-indigo-600'
        : 'border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-100';
      case 'fm': return active
        ? 'bg-amber-500 text-white border-amber-600'
        : 'border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100';
      case 'hra': return active
        ? 'bg-pink-500 text-white border-pink-600'
        : 'border-pink-500 text-pink-600 bg-pink-50 hover:bg-pink-100';
      case 'cs': return active
        ? 'bg-lime-500 text-white border-lime-600'
        : 'border-lime-500 text-lime-600 bg-lime-50 hover:bg-lime-100';
      case 'sales': return active
        ? 'bg-orange-500 text-white border-orange-600'
        : 'border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100';
      case 'LVM-EXPAT': return active
        ? 'bg-violet-500 text-white border-violet-600'
        : 'border-violet-500 text-violet-600 bg-violet-50 hover:bg-violet-100';
      default: return active
        ? 'bg-gray-500 text-white border-gray-600'
        : 'border-gray-500 text-gray-600 bg-gray-50 hover:bg-gray-100';
    }
  };

  // Check if user can access a specific tab
  const canAccessTab = (tabName: string) => {
    if (!user) return false;
    
    return canAccessProjectTab(
      user.role || '',
      user.department || '',
      user.id,
      tabName,
      departments,
      projectOwnerId
    );
  };

  // Check if user can access a department tab
  const canAccessDeptTab = (dept: string) => {
    if (!user) return false;
    
    return canAccessDepartmentTab(
      user.role || '',
      user.department || '',
      dept
    );
  };

  return (
    <div className="flex flex-wrap gap-0.5 border-b mb-3" role="tablist" aria-label="Project Tabs">
      {/* Department Tabs - Only show if user has access */}
      {departments.map((dept: string) => {
        const isActive = activeTab === dept;
        const hasAccess = canAccessDeptTab(dept);
        
        if (!hasAccess) return null;
        
        return (
          <button
            key={dept}
            role="tab"
            aria-selected={isActive}
            aria-controls={`dept-pane-${dept}`}
            id={`dept-tab-${dept}`}
            tabIndex={isActive ? 0 : -1}
            className={`px-2 py-1 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
              getTabColor(dept, isActive)
            }`}
            onClick={() => onTabChange(dept)}
          >
            {DEPARTMENTS.find(d => d.value === dept)?.label || dept}
          </button>
        );
      })}
      
      {/* Main tab - All project members can access */}
      {canAccessTab("MAIN") && (
        <button
          key="MAIN"
          role="tab"
          aria-selected={activeTab === "MAIN"}
          aria-controls="main-pane"
          id="main-tab"
          tabIndex={activeTab === "MAIN" ? 0 : -1}
          className={`px-2 py-1 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "MAIN" 
              ? "border-b-2 bg-white shadow-sm border-slate-500 text-slate-700" 
              : "border-transparent border-slate-500 text-slate-600 bg-slate-50 hover:bg-slate-100"
          }`}
          onClick={() => onTabChange("MAIN")}
        >
          Main
        </button>
      )}
      
      {/* KPI tab - Only managers and above */}
      {canAccessTab("ANALYTICS") && (
        <button
          key="ANALYTICS"
          role="tab"
          aria-selected={activeTab === "ANALYTICS"}
          aria-controls="analytics-pane"
          id="analytics-tab"
          tabIndex={activeTab === "ANALYTICS" ? 0 : -1}
          className={`px-2 py-1 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "ANALYTICS" 
              ? "border-b-2 bg-white shadow-sm border-purple-500 text-purple-700" 
              : "border-transparent border-purple-500 text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          onClick={() => onTabChange("ANALYTICS")}
        >
          KPI
        </button>
      )}
      
      {/* Task tab - Only project owner and managers */}
      {canAccessTab("tasks") && (
        <button
          key="tasks"
          role="tab"
          aria-selected={activeTab === "tasks"}
          aria-controls="tasks-pane"
          id="tasks-tab"
          tabIndex={activeTab === "tasks" ? 0 : -1}
          className={`px-2 py-1 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "tasks" 
              ? "border-b-2 bg-white shadow-sm border-purple-500 text-purple-700" 
              : "border-transparent border-purple-500 text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          onClick={() => onTabChange("tasks")}
        >
          Task
        </button>
      )}
      
      {/* Published tab - Only managers and above */}
      {canAccessTab("PRODUCTION") && (
        <button
          key="PRODUCTION"
          role="tab"
          aria-selected={activeTab === "PRODUCTION"}
          aria-controls="production-pane"
          id="production-tab"
          tabIndex={activeTab === "PRODUCTION" ? 0 : -1}
          className={`px-2 py-1 text-xs font-medium border-b-2 rounded-t transition-colors duration-150 focus:outline-none ${
            activeTab === "PRODUCTION" 
              ? "border-b-2 bg-white shadow-sm border-orange-500 text-orange-700" 
              : "border-transparent border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100"
          }`}
          onClick={() => onTabChange("PRODUCTION")}
        >
          Published
        </button>
      )}
    </div>
  );
} 