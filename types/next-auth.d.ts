import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      tipaId: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    tipaId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipaId: string;
    role: string;
  }
}
