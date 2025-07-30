"use client";
import { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BsCart4 } from "react-icons/bs";
import { Package, Bot, BarChart3, Database } from "lucide-react";
import { useSession } from "next-auth/react";


interface ProcurementLayoutProps {
  children: ReactNode;
}



const procurementNavItems = [
  {
    route: "/lvm/procurement",
    label: "Dashboard",
    icon: <BarChart3 size={20} />,
  },
  {
    route: "/lvm/procurement/inventory",
    label: "Inventory",
    icon: <Package size={20} />,
  },
  {
    route: "/lvm/procurement/purchase-orders",
    label: "Purchase Orders",
    icon: <BsCart4 size={20} />,
  },
  {
    route: "/lvm/procurement/ai-agent",
    label: "AI Agent",
    icon: <Bot size={20} />,
  },
  {
    route: "/lvm/procurement/jde-testing",
    label: "JDE Testing",
    icon: <Database size={20} />,
  },
];

function ProcurementNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Check if user has access to procurement
  const hasProcurementAccess = session?.user?.department === 'PROC' || 
                               session?.user?.centralDepartment === 'PROC' ||
                               session?.user?.role === 'ADMIN';
  
  // If user doesn't have procurement access, don't render the navigation
  if (!hasProcurementAccess) {
    return null;
  }
  
  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {procurementNavItems.map((item) => {
            const isActive = pathname === item.route;
            return (
              <Link
                key={item.route}
                href={item.route}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function ProcurementBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbItems = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
    
    return {
      href,
      label,
      isLast: index === segments.length - 1
    };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center">
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="text-sm font-medium text-gray-900">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <Link href={item.href} className="text-sm text-gray-500 hover:text-gray-700">
                  {item.label}
                </Link>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}



export default function ProcurementLayout({ children }: ProcurementLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Procurement Navigation */}
      <ProcurementNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <ProcurementBreadcrumb />
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
} 