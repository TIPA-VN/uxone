import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: string;
      tipaId: string;
    };
  }
  interface User extends DefaultUser {
    role: string;
    tipaId: string;
    hashedPassword: string;
  }
}
