import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      department: string;
      departmentName: string;
      position?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    role: string;
    department: string;
    departmentName: string;
    position?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
    department: string;
    departmentName: string;
    position?: string | null;
  }
}

// Export Prisma types for use in other files
export type UserCreateData = Prisma.UserCreateInput;
export type UserUpdateData = Prisma.UserUpdateInput;
export type UserWhereUnique = Prisma.UserWhereUniqueInput;
