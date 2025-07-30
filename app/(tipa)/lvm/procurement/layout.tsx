"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BsCart4 } from "react-icons/bs";
import { Package, Bot, BarChart3 } from "lucide-react";
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
    <div className="bg-white border-b border-gray-200 mb-2">
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


export default function ProcurementLayout({ children }: ProcurementLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Procurement Navigation */}
      <ProcurementNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
} 