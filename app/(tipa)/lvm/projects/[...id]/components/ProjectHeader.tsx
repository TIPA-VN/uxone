import { Project } from '../types/project';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
  user: any;
  onApproval: (action: "approved" | "disapproved") => void;
  actionStatus: string | null;
  activeTab: string;
}

const getStatusIcon = (status: string | undefined) => {
  switch(status) {
    case "APPROVED":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "REJECTED":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "PENDING":
      return <Clock className="w-5 h-5 text-orange-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
  }
};

export function ProjectHeader({ project, user, onApproval, actionStatus, activeTab }: ProjectHeaderProps) {
  const approvalState = project?.approvalState || {};
  const isAdminOrSenior = ["ADMIN", "SENIOR MANAGER"].includes(user?.role?.toUpperCase() || "");
  const isSeniorManagerOfDept =
    user &&
    user.role?.toUpperCase() === "SENIOR MANAGER" &&
    user.department?.toUpperCase() === activeTab;
  const canApprove =
    user &&
    project &&
    isSeniorManagerOfDept &&
    approvalState[activeTab] !== "APPROVED" &&
    approvalState[activeTab] !== "REJECTED";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {getStatusIcon(project.status)}
              <span className="ml-2 text-sm font-medium text-gray-900">
                {project.status || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Section */}
      {canApprove && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Department Approval Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                As a Senior Manager of {activeTab}, you can approve or reject this project.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onApproval("approved")}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => onApproval("disapproved")}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Status */}
      {actionStatus && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-blue-800">{actionStatus}</p>
        </div>
      )}

      {/* Project Details */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Departments:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {project.departments?.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Request Date:</span>
            <p className="mt-1 text-gray-600">
              {project.requestDate ? new Date(project.requestDate).toLocaleDateString() : "Not set"}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <p className="mt-1 text-gray-600">
              {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 