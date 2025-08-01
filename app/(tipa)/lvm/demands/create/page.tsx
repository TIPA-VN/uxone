"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ShoppingCart, 
  Shield, 
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { canAccessFeature, mapRoleToConfigKey } from "@/config/app";
import Link from "next/link";

export default function CreateDemandsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has supervisor+ permissions
  const hasSupervisorPermissions = () => {
    if (!session?.user?.role) return false;
    
    // Direct role check first (for debugging)
    const userRole = session.user.role;
    console.log("User role:", userRole); // Debug log
    
    // Check if role contains "SENIOR_MANAGER" or "MANAGER" (case insensitive)
    const roleUpper = userRole.toUpperCase();
    const hasManagerRole = roleUpper.includes("SENIOR_MANAGER") || 
                          roleUpper.includes("SENIOR MANAGER") ||
                          roleUpper.includes("MANAGER") ||
                          roleUpper.includes("SUPERVISOR") ||
                          roleUpper.includes("DIRECTOR") ||
                          roleUpper.includes("ADMIN");
    
    // Also try the mapped role
    const mappedRole = mapRoleToConfigKey(userRole);
    const supervisorRoles = [
      "SUPERVISOR", "SUPERVISOR_2", "LINE_LEADER",
      "MANAGER", "MANAGER_2", "ASSISTANT_MANAGER", "ASSISTANT_MANAGER_2",
      "ASSISTANT_SENIOR_MANAGER", "SENIOR_MANAGER", "SENIOR_MANAGER_2",
      "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
      "GENERAL_MANAGER", "GENERAL_DIRECTOR", "ADMIN"
    ];
    
    const hasMappedRole = supervisorRoles.includes(mappedRole);
    
    console.log("Mapped role:", mappedRole, "Has mapped role:", hasMappedRole); // Debug log
    console.log("Has manager role:", hasManagerRole); // Debug log
    
    return hasManagerRole || hasMappedRole;
  };

  // Check if user is from PR team
  const isPRTeamMember = () => {
    const userDepartment = session?.user?.department || session?.user?.centralDepartment;
    return userDepartment === "PROC";
  };

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    setIsLoading(false);
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span>Authentication required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/lvm">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Demands</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create Demands</h1>
        <p className="text-gray-600">
          Select the type of demand you want to create based on your permissions.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Standard Demands Card */}
        {hasSupervisorPermissions() && (
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Standard Demands</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    Supervisor+
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm text-gray-600">
                Create standard purchase demands for regular business operations. 
                Available for supervisors and above.
              </CardDescription>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Standard approval workflow</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span>Regular procurement items</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href="/lvm/demands/create/standard">
                  <span>Create Standard Demand</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Special GL Demands Card - Only for PR Team */}
        {isPRTeamMember() && (
          <Card className="hover:shadow-lg transition-shadow duration-200 border-green-200 bg-green-50/30">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Special GL Demands</CardTitle>
                  <Badge variant="outline" className="mt-1 border-green-300 text-green-700">
                    PR Team Only
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm text-gray-600">
                Create special demands with specific GL (General Ledger) classifications. 
                Restricted to Procurement team members only.
              </CardDescription>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Special GL classifications</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Advanced approval routing</span>
                </div>
              </div>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/lvm/demands/create/special-gl">
                  <span>Create Special GL Demand</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Access Denied Message */}
      {!hasSupervisorPermissions() && !isPRTeamMember() && (
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Access Restricted</h3>
                <p className="text-sm text-red-600 mt-1">
                  You don't have permission to create demands. Contact your supervisor for access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Info (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p><strong>User:</strong> {session.user.username}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
              <p><strong>Department:</strong> {session.user.department || session.user.centralDepartment}</p>
              <p><strong>Has Supervisor Permissions:</strong> {hasSupervisorPermissions() ? "Yes" : "No"}</p>
              <p><strong>Is PR Team:</strong> {isPRTeamMember() ? "Yes" : "No"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 