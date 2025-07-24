import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Prisma, User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: string;
      department: string | null;
      departmentName: string | null;
      position: string | null;
    } & DefaultSession["user"];
  }

  interface User extends Omit<PrismaUser, "hashedPassword" | "createdAt" | "updatedAt"> {}
}

declare module "next-auth/jwt" {
  interface JWT extends Omit<PrismaUser, "hashedPassword" | "createdAt" | "updatedAt"> {}
}

// Export Prisma types for use in other files
export type UserCreateData = Prisma.UserCreateInput;
export type UserUpdateData = Prisma.UserUpdateInput;
export type UserWhereUnique = Prisma.UserWhereUniqueInput;
