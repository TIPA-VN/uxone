import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    username: string
    role: string
    department: string
    centralDepartment: string
    departmentName: string
    position?: string | null
    isFallbackAuth?: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username: string
      role: string
      department: string
      centralDepartment: string
      departmentName: string
      position?: string | null
      isFallbackAuth?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: string
    department: string
    centralDepartment: string
    departmentName: string
    position?: string | null
    isFallbackAuth?: boolean
  }
}

// Export Prisma types for use in other files
export type UserCreateData = Prisma.UserCreateInput;
export type UserUpdateData = Prisma.UserUpdateInput;
export type UserWhereUnique = Prisma.UserWhereUniqueInput;
