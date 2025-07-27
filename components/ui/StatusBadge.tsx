import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const getStatusIcon = (status: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  switch(status?.toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
      return <CheckCircle className={`${sizeClasses[size]} text-green-500`} />;
    case "REJECTED":
    case "BLOCKED":
      return <XCircle className={`${sizeClasses[size]} text-red-500`} />;
    case "PENDING":
    case "IN_PROGRESS":
      return <Clock className={`${sizeClasses[size]} text-blue-500`} />;
    case "TODO":
      return <Clock className={`${sizeClasses[size]} text-gray-400`} />;
    default:
      return <AlertCircle className={`${sizeClasses[size]} text-gray-400`} />;
  }
};

export const StatusBadge = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className = '' 
}: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${getStatusColor(status)} ${sizeClasses[size]} ${className}`}>
      {showIcon && getStatusIcon(status, size)}
      {status}
    </span>
  );
}; 