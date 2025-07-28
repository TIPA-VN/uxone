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
    (user.department?.toUpperCase() === activeTab?.toUpperCase() || 
     user.department?.toLowerCase() === activeTab?.toLowerCase());
  // Allow ADMIN to approve any department, or SENIOR MANAGER to approve their own department
  const canApprove =
    user &&
    project &&
    (user.role?.toUpperCase() === "ADMIN" || 
     isSeniorManagerOfDept || 
     project.ownerId === user.id) &&
    approvalState[activeTab] !== "APPROVED" &&
    approvalState[activeTab] !== "REJECTED";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-0.5 text-xs text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              {getStatusIcon(project.status)}
              <span className="ml-1.5 text-xs font-medium text-gray-900">
                {project.status || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Section */}
      {canApprove && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-yellow-800">
                Department Approval Required
              </h3>
              <p className="text-xs text-yellow-700 mt-0.5">
                {user?.role?.toUpperCase() === "ADMIN" 
                  ? `As an Admin, you can approve or reject this project for the ${activeTab} department.`
                  : project.ownerId === user?.id
                  ? `As the project owner, you can approve or reject this project for the ${activeTab} department.`
                  : `As a Senior Manager of ${activeTab}, you can approve or reject this project.`
                }
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onApproval("approved")}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => onApproval("disapproved")}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Status */}
      {actionStatus && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <p className="text-xs text-blue-800">{actionStatus}</p>
        </div>
      )}


    </div>
  );
} 