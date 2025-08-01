import { z } from "zod";

export const signInSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;

// Demand Creation Schema
export const demandCreationSchema = z.object({
  // BU and Department selection
  bu: z.string().min(1, "Business Unit is required"),
  department: z.string().min(1, "Department is required"),
  account: z.number().min(1, "Account number is required"),
  approvalRoute: z.string().nullable(),
  
  // Expense Account selection
  expenseAccount: z.number().min(1, "Expense account is required"),
  expenseDescription: z.string().min(1, "Expense description is required"),
  expenseGLClass: z.string().min(1, "Expense GL class is required"),
  expenseStockType: z.string().min(1, "Expense stock type is required"),
  expenseOrderType: z.string().min(1, "Expense order type is required"),
  
  itemDescription: z.string().min(1, "Item description is required").max(500, "Description must be less than 500 characters"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  estimatedCost: z.number().min(0, "Estimated cost must be non-negative"),
  justification: z.string().min(10, "Justification must be at least 10 characters").max(1000, "Justification must be less than 1000 characters"),
  priorityLevel: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
    required_error: "Priority level is required",
  }),
  expectedDeliveryDate: z.date({
    required_error: "Expected delivery date is required",
  }),
  // Department-specific fields
  departmentSpecific: z.object({
    technicalSpecs: z.string().optional(),
    supplierPreference: z.string().optional(),
    budgetCode: z.string().optional(),
    projectCode: z.string().optional(),
    urgencyReason: z.string().optional(),
  }).optional(),
  // File attachments
  attachments: z.array(z.string()).optional(),
});

export type DemandCreationInput = z.infer<typeof demandCreationSchema>;