import { z } from "zod";

export const signInSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(8, "Username must be at least 8 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;

// Role mapping configuration
export const ROLE_MAPPING = {
  "SENIOR MANAGER": "SENIOR MANAGER",
  "MANAGER": "MANAGER",
  "SUPERVISOR": "SUPERVISOR",
  "STAFF": "USER",
} as const;

// Define all possible roles including both mapped and unmapped roles
export const ROLES = {
  ADMIN: "ADMIN",
  SENIOR_MANAGER: "SENIOR MANAGER",
  MANAGER: "MANAGER",
  SUPERVISOR: "SUPERVISOR",
  USER: "USER",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];