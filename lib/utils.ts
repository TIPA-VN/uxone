import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateToInput(date: Date | string) {
  return new Date(date).toISOString().split("T")[0]
}

export function getWeekNumber(date: Date) {
  const tmp = new Date(date.getTime())
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() - tmp.getDay() + 1)
  const weekNo = Math.ceil((((tmp.getTime() - new Date(tmp.getFullYear(), 0, 2).getTime()) / 86400000) - 1) / 7)
  return `${tmp.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export function getISOWeekString(date: Date = new Date()) {
  return getWeekNumber(date);
}

// Status and Priority Utilities
export const getStatusIconName = (status: string | undefined) => {
  switch(status?.toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
      return "check-circle";
    case "REJECTED":
    case "BLOCKED":
      return "x-circle";
    case "PENDING":
    case "IN_PROGRESS":
      return "clock";
    case "TODO":
      return "clock";
    default:
      return "alert-circle";
  }
};

export const getStatusColor = (status: string) => {
  switch(status?.toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "REJECTED":
    case "BLOCKED":
      return "bg-red-100 text-red-800 border-red-200";
    case "PENDING":
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "TODO":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "ACTIVE":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ON_HOLD":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getPriorityColor = (priority: string) => {
  switch(priority?.toUpperCase()) {
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 80) return "text-green-600";
  if (efficiency >= 60) return "text-yellow-600";
  return "text-red-600";
};

// Date and Time Utilities
export const isOverdue = (dueDate: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const formatDateString = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString();
};

// File Utilities
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validation Utilities
export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateRequired = (value: string) => {
  return value.trim().length > 0;
};

// Array Utilities
export const sortByDate = <T extends { createdAt: string }>(items: T[], order: 'asc' | 'desc' = 'desc') => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

export const filterByStatus = <T extends { status: string }>(items: T[], status: string) => {
  return items.filter(item => item.status === status);
};

// String Utilities
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
