"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Shield,
  Building2,
  FileText,
  Mail,
  Code,
  Activity,
  UserCheck,
  Database,
  Settings,
  ChevronRight,
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

const adminNavItems: AdminNavItem[] = [
  {
    href: "/lvm/admin",
    label: "Dashboard",
    icon: Home,
    description: "System overview and statistics"
  },
  {
    href: "/lvm/admin/users",
    label: "User Management",
    icon: Users,
    description: "Manage user accounts and permissions",
    badge: "Core"
  },
  {
    href: "/lvm/admin/roles",
    label: "Role Management",
    icon: UserCheck,
    description: "Define and manage user roles",
    badge: "Core"
  },
  {
    href: "/lvm/admin/rbac",
    label: "RBAC System",
    icon: Shield,
    description: "Advanced access control management",
    badge: "Advanced"
  },
  {
    href: "/lvm/admin/departments",
    label: "Departments",
    icon: Building2,
    description: "Organizational structure management",
    badge: "Core"
  },
  {
    href: "/lvm/admin/department-codes",
    label: "Department Codes",
    icon: Code,
    description: "Department coding and classification",
    badge: "Config"
  },
  {
    href: "/lvm/admin/document-templates",
    label: "Document Templates",
    icon: FileText,
    description: "Template management system",
    badge: "Content"
  },
  {
    href: "/lvm/admin/email-webhook-test",
    label: "Email Webhook Test",
    icon: Mail,
    description: "Test email integration",
    badge: "Testing"
  },
  {
    href: "/lvm/admin/settings",
    label: "System Settings",
    icon: Settings,
    description: "Global configuration options",
    badge: "Core"
  }
];

interface AdminNavigationProps {
  className?: string;
  showDescriptions?: boolean;
  compact?: boolean;
}

export default function AdminNavigation({ 
  className, 
  showDescriptions = true, 
  compact = false 
}: AdminNavigationProps) {
  const pathname = usePathname();

  const getBadgeVariant = (badge?: string) => {
    switch (badge) {
      case "Core":
        return "default";
      case "Advanced":
        return "secondary";
      case "Config":
        return "outline";
      case "Content":
        return "outline";
      case "Testing":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <nav className={cn("space-y-1", className)}>
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-blue-100 text-blue-900 border-r-2 border-blue-500"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
              )}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={getBadgeVariant(item.badge)} 
                    className="ml-2 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              {showDescriptions && !compact && (
                <p className={cn(
                  "text-xs truncate mt-0.5",
                  isActive ? "text-blue-700" : "text-gray-500"
                )}>
                  {item.description}
                </p>
              )}
            </div>
            
            {isActive && (
              <ChevronRight className="ml-auto h-4 w-4 text-blue-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Compact version for sidebars
export function AdminNavigationCompact({ className }: { className?: string }) {
  return <AdminNavigation className={className} showDescriptions={false} compact={true} />;
}

// Breadcrumb navigation
export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length < 2 || segments[0] !== 'admin') {
    return null;
  }

  const breadcrumbItems = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    
    // Find the nav item for this segment
    const navItem = adminNavItems.find(item => 
      item.href === href || item.href.endsWith(segment)
    );
    
    return {
      href,
      label: navItem?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
      isLast
    };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          )}
          {item.isLast ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
