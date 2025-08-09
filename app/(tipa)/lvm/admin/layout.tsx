import AdminNavigation, { AdminBreadcrumb } from "@/components/AdminNavigation";
import { Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">System Administration</p>
              </div>
            </div>

            {/* Navigation */}
            <AdminNavigation />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {/* Breadcrumb */}
            <AdminBreadcrumb />
            
            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
