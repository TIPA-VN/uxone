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
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield
} from "lucide-react";
import Link from "next/link";

export default function SpecialGLDemandPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

    // Redirect if not PR team member
    if (status === "authenticated" && !isPRTeamMember()) {
      router.push("/lvm/demands/create");
      return;
    }

    setIsLoading(false);
  }, [status, router, isPRTeamMember]);

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

  if (!isPRTeamMember()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span>Access denied. PR team members only.</span>
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
            <BreadcrumbLink href="/lvm/demands/create">Create Demands</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Special GL Demand</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/lvm/demands/create">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Special GL Demand Form</h1>
            <Badge variant="outline" className="border-green-300 text-green-700">
              <Shield className="h-3 w-3 mr-1" />
              PR Team Only
            </Badge>
          </div>
        </div>
        <p className="text-gray-600">
          Create special demands with specific GL (General Ledger) classifications.
        </p>
      </div>

      {/* Form Placeholder */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Special GL Demand Form</span>
          </CardTitle>
          <CardDescription>
            This form will be implemented to create special demands with GL classifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Form Under Development</p>
              <p className="text-sm">The special GL demand form is currently being developed.</p>
            </div>
            <Button asChild>
              <Link href="/lvm/demands/create">
                Return to Demands
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 