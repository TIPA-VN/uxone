import { Project } from '../types/project';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
  user: {
    id: string;
    role?: string;
    department?: string;
  } | null | undefined;
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

export function ProjectHeader({ project, user, activeTab }: ProjectHeaderProps) {
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
    </div>
  );
} 