import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { signInSchema, ROLE_MAPPING } from "@/lib/zod";
import type { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import type { UserCreateData, UserUpdateData, UserWhereUnique } from "@/types/next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate input with Zod
          const validatedCredentials = await signInSchema.parseAsync(credentials);

          console.log("Attempting to authenticate user:", validatedCredentials.username);

          // Call our authentication API
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: validatedCredentials.username,
              password: validatedCredentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Authentication API error:", error);
            throw new Error(error.details || error.message || "Authentication failed");
          }

          const data = await response.json();
          console.log("Authentication response:", {
            message: data.message,
            emp_code: data.emp_code,
            emp_pos: data.emp_pos,
          });
          
          if (data.message !== "OK") {
            console.error("Authentication failed:", data);
            throw new Error(`Authentication failed: ${data.message || "Invalid credentials"}`);
          }

          // Map the role based on position
          const mappedRole = ROLE_MAPPING[data.emp_pos as keyof typeof ROLE_MAPPING] || "USER";
          console.log("Mapped role:", { position: data.emp_pos, role: mappedRole });

          // Find or create user in our database
          const where = {
            username: data.emp_code,
          } as unknown as UserWhereUnique;

          let user = await prisma.user.findUnique({ where });

          const userData = {
            username: data.emp_code,
            name: data.emp_name,
            email: `${data.emp_code}@tipa.co.th`,
            hashedPassword: "centrally-authenticated",
            department: data.emp_dept,
            departmentName: data.emp_dept_name,
            position: data.emp_pos,
            role: mappedRole,
            image: null,
          } as unknown as UserCreateData;

          if (!user) {
            console.log("Creating new user:", data.emp_code);
            user = await prisma.user.create({
              data: userData,
            });
          } else {
            console.log("Updating existing user:", data.emp_code);
            const updateData = { ...userData } as unknown as UserUpdateData;
            user = await prisma.user.update({
              where,
              data: updateData,
            });
          }

          // Return the user data in the expected format
          const userResult = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            username: (user as any).username,
            department: (user as any).department,
            departmentName: (user as any).departmentName,
            position: (user as any).position,
            image: user.image,
          } as unknown as User;

          console.log("Authentication successful for user:", userResult.username);
          return userResult;
        } catch (error) {
          console.error("Auth error details:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          });
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("An unexpected error occurred");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in
        return {
          ...token,
          id: user.id,
          username: user.username,
          role: user.role,
          department: user.department,
          departmentName: user.departmentName,
          position: user.position,
        };
      }

      // Handle session update
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        session.user.departmentName = token.departmentName as string;
        session.user.position = token.position as string;
      }
      return session;
    },
  },

  events: {
    async signIn(message) {
      if (message.user.email) {
        console.log("User signed in:", message.user.email);
      }
    },
    async signOut(message) {
      if ('token' in message && message.token?.email) {
        console.log("User signed out:", message.token.email);
      }
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
});
