import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function UsersPage() {
  const session = await auth();
  
  if (!session?.user || !hasPermission(session.user.role, "manage_users")) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">User Management</h1>
      <DataTable columns={columns} data={users} />
    </div>
  );
} 