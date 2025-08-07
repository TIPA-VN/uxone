"use client";
import { AlertTriangle, Calendar } from "lucide-react";
import { Project, Task } from "../types/project";
import { ApprovalStamp } from "./ApprovalStamp";
import { canEditProjectMainTab } from "@/lib/rbac";

interface ProjectOverviewProps {
  project: Project;
  tasks: Task[];
  user: {
    id: string;
    role?: string;
  } | null | undefined;
  onUpdateProjectStatus: (newStatus: string) => void;
  onEditDueDates: () => void;
  showDueDateEditor: boolean;
}

const DEPARTMENTS = [
  { value: "logistics", label: "Logistics" },
  { value: "procurement", label: "Procurement" },
  { value: "pc", label: "Production Planning" },
  { value: "qa", label: "Quality Assurance" },
  { value: "qc", label: "Quality Control" },
  { value: "pm", label: "Production Maintenance" },
  { value: "fm", label: "Facility Management" },
  { value: "hra", label: "Human Resources" },
  { value: "cs", label: "Customer Service" },
  { value: "sales", label: "Sales" },
  { value: "LVM-EXPAT", label: "LVM EXPATS" },
];

export function ProjectOverview({ 
  project, 
  tasks, 
  user, 
  onUpdateProjectStatus, 
  onEditDueDates, 
  showDueDateEditor 
}: ProjectOverviewProps) {
  const approvalState = project?.approvalState || {};

  // Permission check for editing due dates
  const canEditDueDates = user && canEditProjectMainTab(
    user.role || '',
    user.id,
    project.ownerId || ''
  );

  return (
    <div className="w-full">
      {/* Project Status and Approval History */}
      <div className="w-full">
        {/* Project Overview split into two cards */}
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          {/* Left Card: Name, Status, Description */}
          <div className="bg-white rounded-lg shadow p-2 flex-1 min-w-[180px] relative">
            <ApprovalStamp isApproved={project.status === "APPROVED"} />
            <h3 className="font-semibold text-base mb-2 text-gray-800">Project Overview</h3>
            <div className="space-y-2 text-xs">

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Status:</span>
                <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                  project.status === "APPROVED" ? "bg-green-100 text-green-800" :
                  project.status === "PENDING" ? "bg-orange-100 text-orange-800" :
                  project.status === "REJECTED" ? "bg-red-100 text-red-800" :
                  project.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                  project.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                  project.status === "ON_HOLD" ? "bg-yellow-100 text-yellow-800" :
                  project.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {project.status || "UNKNOWN"}
                </span>
              </div>
              
              {/* Project Status Management - Only for project owner */}
              {project.ownerId === user?.id && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-600 text-xs">Update Status:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((status) => {
                      const hasIncompleteTasks = tasks.some(task => task.status !== 'COMPLETED');
                      const isCompletedButton = status === 'COMPLETED';
                      const isDisabled = isCompletedButton && hasIncompleteTasks && tasks.length > 0;
                      
                      return (
                        <button
                          key={status}
                          onClick={() => onUpdateProjectStatus(status)}
                          disabled={isDisabled || project.status === status}
                          className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                            project.status === status
                              ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-default'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                          }`}
                          title={isCompletedButton && hasIncompleteTasks && tasks.length > 0 
                            ? "Complete all tasks first" 
                            : undefined}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                  {tasks.some(task => task.status !== 'COMPLETED') && tasks.length > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Complete all tasks before marking project as completed
                    </p>
                  )}
                </div>
              )}

              {/* Warning for incomplete tasks */}
              {tasks.some(task => task.status !== 'COMPLETED') && tasks.length > 0 && (
                <div className="mt-2 p-1 bg-orange-50 border border-orange-200 rounded text-xs">
                  <div className="flex items-center gap-1 text-orange-700">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">Incomplete Tasks</span>
                  </div>
                  <p className="text-orange-600 mt-1">
                    {tasks.filter(task => task.status !== 'COMPLETED').length} of {tasks.length} tasks incomplete
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Right Card: Edit Due Dates, Request Date, Department Due Dates */}
          <div className="bg-white rounded-lg shadow p-2 flex-1 min-w-[180px] relative">
            <ApprovalStamp isApproved={project.status === "APPROVED"} />
            <div className="flex flex-col gap-2">
              {/* Edit Due Dates Button - Only for project owner and admins */}
              {canEditDueDates && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={onEditDueDates}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shadow-sm ${
                      showDueDateEditor 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {showDueDateEditor ? 'Due Date Editor Open' : 'Edit Due Dates'}
                  </button>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 text-sm">Project Request Date:</span>
                <span className="text-gray-900 font-semibold text-right max-w-xs text-sm">
                  {project.requestDate ? new Date(project.requestDate).toLocaleDateString() : <span className="text-gray-400 italic">Not set</span>}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 text-sm">Department Due Dates:</span>
                <div className="text-gray-800 text-right max-w-xs text-sm">
                  {project.departmentDueDates && Object.entries(project.departmentDueDates).length > 0 ? (
                    <ul className="list-none p-0 m-0">
                      {Object.entries(project.departmentDueDates).map(([dept, date]) => (
                        <li key={dept} className="text-sm text-gray-600">
                           {DEPARTMENTS.find(d => d.value === dept)?.label || dept}: {new Date(date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="bg-white rounded-lg shadow p-2 relative">
          <ApprovalStamp isApproved={project.status === "APPROVED"} />
          <h3 className="font-semibold text-base mb-2 text-gray-800">Approval Status by Department</h3>
          <div className="space-y-2">
            {(project.departments || []).map((dept: string) => {
              const statusObj = approvalState[dept];
              const logsArray: Array<{ status: string; user: string; timestamp: string }> = Array.isArray(statusObj) ? statusObj : [];
              const latest = logsArray.length > 0 ? logsArray[logsArray.length - 1] : null;
              const status = latest ? latest.status : statusObj;
              const timestamp = latest ? latest.timestamp : null;
              const user = latest ? latest.user : null;
              const deptLabel = DEPARTMENTS.find(d => d.value === dept)?.label || dept;
              
              return (
                <div key={dept} className="border border-gray-200 rounded-lg p-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800 text-xs">{deptLabel}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-medium px-1 py-0.5 rounded-full ${
                        status === "APPROVED" ? "bg-green-100 text-green-800" :
                        status === "REJECTED" ? "bg-red-100 text-red-800" :
                        status === "PENDING" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {status || "NOT STARTED"}
                      </span>
                    </div>
                  </div>
                  {timestamp && (
                    <div className="text-[10px] text-gray-500">
                      {new Date(timestamp).toLocaleString()}
                      {user && <span className="ml-1 text-blue-600">by {user}</span>}
                    </div>
                  )}
                  {logsArray.length > 1 && (
                    <div className="mt-1 pt-1 border-t border-gray-100">
                      <div className="text-[10px] font-medium text-gray-600 mb-0.5">History:</div>
                      <div className="space-y-0.5">
                        {logsArray.slice(-3).map((log: { status: string; user: string; timestamp: string }, idx: number) => {
                          let color = '';
                          if (log.status === 'REJECTED') color = 'text-red-600';
                          else if (log.status === 'APPROVED') color = 'text-green-600';
                          else if (log.status === 'PENDING') color = 'text-orange-600';
                          return (
                            <div key={idx} className={`text-[10px] text-gray-500 ${color}`}>
                              {log.status} by {log.user} at {new Date(log.timestamp).toLocaleString()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 