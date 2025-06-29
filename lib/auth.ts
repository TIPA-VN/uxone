import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { signInSchema } from "@/lib/zod";
import { verifyPassword } from "@/lib/hashPassword";
import type { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        tipaId: { label: "id", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { tipaId, password } = await signInSchema.parseAsync(
            credentials
          );

          const user = await prisma.user.findUnique({
            where: { tipaId }, // ✅ using validated tipaId
          });

          if (!user) return null;


          const passwordValid = await verifyPassword(
            password,
            user.hashedPassword
          ); // ✅ validated password
          if (!passwordValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tipaId: user.tipaId,
            image: user.image,
          } as User;
        } catch (error) {
          if (error instanceof ZodError) return null;
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User }) {
      if (user) {
        token.tipaId = user.tipaId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.tipaId = token.tipaId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
