import React from "react";
import { CheckCircle, XCircle, Clock, MessageCircle, FileText, User, Calendar, AlertTriangle } from "lucide-react";
import { GanttChart } from "./GanttChart";

interface ProjectAnalyticsProps {
  project: any;
  approvalState: Record<string, any>;
  comments: Array<{
    id: string;
    text: string;
    author: string;
    authorId: string;
    timestamp: string;
    type: 'comment' | 'update';
  }>;
  docs: any[];
  productionDocs: any[];
}

function getLatestStatus(logs: any) {
  if (Array.isArray(logs) && logs.length > 0) return logs[logs.length - 1].status;
  return logs;
}

function getLatestTimestamp(logs: any) {
  if (Array.isArray(logs) && logs.length > 0) return logs[logs.length - 1].timestamp;
  return null;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ project, approvalState, comments, docs, productionDocs }) => {
  // Progress Tracking
  const departments = project?.departments || [];
  const approvalStats = departments.reduce(
    (acc: any, dept: string) => {
      const logs = approvalState[dept];
      const status = getLatestStatus(logs);
      if (status === "APPROVED") acc.approved++;
      else if (status === "REJECTED") acc.rejected++;
      else acc.pending++;
      return acc;
    },
    { approved: 0, rejected: 0, pending: 0 }
  );
  const totalDepts = departments.length;
  const progress = totalDepts > 0 ? (approvalStats.approved / totalDepts) * 100 : 0;
  let progressColor = "bg-orange-400";
  if (approvalStats.rejected > 0) progressColor = "bg-red-500";
  else if (approvalStats.approved === totalDepts) progressColor = "bg-green-500";
  else if (approvalStats.approved > 0) progressColor = "bg-green-400";

  // Due Date Analytics
  const requestDate = project?.requestDate;
  const departmentDueDates = project?.departmentDueDates || {};
  
  // Timeline Events
  let timeline: Array<any> = [];
  departments.forEach((dept: string) => {
    const logs = approvalState[dept];
    if (Array.isArray(logs)) {
      logs.forEach((log: any) => {
        timeline.push({
          type: log.status,
          user: log.user,
          timestamp: log.timestamp,
          department: dept,
        });
      });
    } else if (logs && logs.status) {
      timeline.push({
        type: logs.status,
        user: logs.user,
        timestamp: logs.timestamp,
        department: dept,
      });
    }
  });
  comments.forEach((c) => {
    timeline.push({
      type: c.type === "comment" ? "COMMENT" : "UPDATE",
      user: c.author,
      timestamp: c.timestamp,
      text: c.text,
    });
  });
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Metrics
  const lastActivity = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Two-column layout: Project Timeline (1/3) and Approval Progress (2/3) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Project Timeline Card - 1/3 width */}
        <div className="lg:w-1/3 w-full">
          <div className="bg-white rounded-lg shadow p-2 h-full">
            <h4 className="font-semibold text-base mb-1 text-gray-800">Project Timeline</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Project Start:</span>
                <span className="text-gray-800">{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Project End:</span>
                <span className="text-gray-800">
                  {requestDate ? new Date(requestDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Total Duration:</span>
                <span className="text-gray-800">
                  {requestDate && project?.createdAt ? 
                    Math.ceil((new Date(requestDate).getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days' : 
                    'Not set'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Approval Progress Card - 2/3 width */}
        <div className="lg:w-2/3 w-full">
          <div className="bg-white rounded-lg shadow p-2 h-full">
            <h4 className="font-semibold text-base mb-1 text-gray-800">Approval Progress</h4>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs font-medium text-gray-700 min-w-[70px]">
                {approvalStats.approved}/{totalDepts} Approved
              </div>
            </div>
            <div className="flex gap-2 text-xs mt-0.5">
              <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> {approvalStats.approved} Approved</div>
              <div className="flex items-center gap-1 text-orange-500"><Clock className="w-4 h-4" /> {approvalStats.pending} Pending</div>
              <div className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> {approvalStats.rejected} Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Due Date Analytics - Gantt Chart */}
      {(requestDate || Object.keys(departmentDueDates).length > 0) && (
        <GanttChart
          requestDate={requestDate}
          departmentDueDates={departmentDueDates}
          approvalState={approvalState}
          projectStartDate={project?.createdAt}
        />
      )}

      {/* Metrics Dashboard */}
      <div className="bg-white rounded-lg shadow p-2">
        <h3 className="font-semibold text-base mb-1">Project Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xl font-bold">{docs.length}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><FileText className="w-4 h-4" /> Documents</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xl font-bold">{comments.length}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4" /> Comments/Updates</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xl font-bold">{approvalStats.approved}</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Approvals</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xl font-bold">{approvalStats.rejected}</div>
            <div className="text-xs text-red-500 flex items-center justify-center gap-1"><XCircle className="w-4 h-4" /> Rejections</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Last Activity: {lastActivity ? (
            <span>
              <User className="inline w-3 h-3 mr-1" />
              {lastActivity.user || "Unknown"} &middot; {lastActivity.type} &middot; {lastActivity.timestamp ? new Date(lastActivity.timestamp).toLocaleString() : ""}
            </span>
          ) : "No activity yet."}
        </div>
      </div>
    </div>
  );
}; 