/*
  Warnings:

  - Added the required column `account` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bu` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `demands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demands" ADD COLUMN     "account" INTEGER NOT NULL,
ADD COLUMN     "approvalRoute" TEXT,
ADD COLUMN     "bu" TEXT NOT NULL,
ADD COLUMN     "department" TEXT NOT NULL;
