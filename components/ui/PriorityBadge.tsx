import { getPriorityColor } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriorityBadge = ({ 
  priority, 
  size = 'md', 
  className = '' 
}: PriorityBadgeProps) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${getPriorityColor(priority)} ${sizeClasses[size]} ${className}`}>
      {priority}
    </span>
  );
}; 