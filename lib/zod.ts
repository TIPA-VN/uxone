import { z } from "zod";
import { EmployeePosition, UserRole } from "./rbac";

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

// Function to convert position string to enum format
export function normalizePosition(position: string): EmployeePosition {
  // Remove spaces and convert to uppercase
  const normalized = position.replace(/\s+/g, '_').toUpperCase();
  return normalized as EmployeePosition;
}

// Role mapping based on position
export function mapPositionToRole(position: string): UserRole {
  const normalizedPos = position.toUpperCase();
  
  if (normalizedPos.includes('GENERAL_DIRECTOR') || normalizedPos.includes('GENERAL DIRECTOR')) {
    return UserRole.SUPER_ADMIN;
  }
  
  if (normalizedPos.includes('SENIOR_MANAGER') || normalizedPos.includes('SENIOR MANAGER') ||
      normalizedPos.includes('ASSISTANT_GENERAL_MANAGER') || normalizedPos.includes('ASSISTANT GENERAL MANAGER')) {
    return UserRole.ADMIN;
  }
  
  if (normalizedPos.includes('MANAGER') || normalizedPos.includes('CHIEF')) {
    return UserRole.MANAGER;
  }
  
  return UserRole.USER;
}