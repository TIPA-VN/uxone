import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// utils/getISOWeekString.ts

export function getISOWeekString(date: Date = new Date()): string {
  // Clone the date so we don't mutate the original
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  // ISO weeks start on Monday, so Sunday (0) becomes 7
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${tmp.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}
