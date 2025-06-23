import { object, string } from "zod"
 
export const signInSchema = object({
  tipaId: string({ required_error: "Tipa Id is required" })
    .min(8, "Tipa Id is required"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
})