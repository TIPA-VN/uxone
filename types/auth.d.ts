import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: string;
      department: string;
      departmentName: string;
      position: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: string;
    department: string;
    departmentName: string;
    position: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    role: string;
    department: string;
    departmentName: string;
    position: string;
  }
} 