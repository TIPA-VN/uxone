/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `position` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeePosition" AS ENUM ('ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'ASSISTANT_MANAGER', 'ASSISTANT_MANAGER_2', 'ASSISTANT_SENIOR_MANAGER', 'ASSOCIATE', 'CHIEF_SPECIALIST', 'ENGINEER', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'INTERN', 'LINE_LEADER', 'MANAGER', 'MANAGER_2', 'OPERATOR', 'SENIOR_ASSOCIATE', 'SENIOR_ENGINEER', 'SENIOR_MANAGER', 'SENIOR_MANAGER_2', 'SENIOR_OPERATOR', 'SENIOR_SPECIALIST', 'SENIOR_SPECIALIST_2', 'SENIOR_STAFF', 'SPECIALIST', 'SPECIALIST_2', 'STAFF', 'SUPERVISOR', 'SUPERVISOR_2', 'TECHNICAL_SPECIALIST', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');

-- Add temporary columns
ALTER TABLE "users" ADD COLUMN "role_new" "UserRole";
ALTER TABLE "users" ADD COLUMN "position_new" "EmployeePosition";

-- Update temporary columns with mapped values
UPDATE "users" 
SET "role_new" = CASE 
    WHEN "role" = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"UserRole"
    WHEN "role" = 'ADMIN' THEN 'ADMIN'::"UserRole"
    WHEN "role" = 'MANAGER' THEN 'MANAGER'::"UserRole"
    ELSE 'USER'::"UserRole"
END;

-- Set default position based on role for existing users
UPDATE "users"
SET "position_new" = CASE
    WHEN "role" = 'SUPER_ADMIN' THEN 'GENERAL_DIRECTOR'::"EmployeePosition"
    WHEN "role" = 'ADMIN' THEN 'SENIOR_MANAGER'::"EmployeePosition"
    WHEN "role" = 'MANAGER' THEN 'MANAGER'::"EmployeePosition"
    ELSE 'STAFF'::"EmployeePosition"
END;

-- Drop old columns and rename new ones
ALTER TABLE "users" DROP COLUMN "role";
ALTER TABLE "users" DROP COLUMN "position";
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";
ALTER TABLE "users" RENAME COLUMN "position_new" TO "position";

-- Add NOT NULL constraints and defaults
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";
ALTER TABLE "users" ALTER COLUMN "position" SET NOT NULL;
