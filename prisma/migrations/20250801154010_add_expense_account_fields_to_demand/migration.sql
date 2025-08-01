/*
  Warnings:

  - Added the required column `expenseAccount` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseDescription` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseGLClass` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseOrderType` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expenseStockType` to the `demands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demands" ADD COLUMN     "expenseAccount" INTEGER NOT NULL,
ADD COLUMN     "expenseDescription" TEXT NOT NULL,
ADD COLUMN     "expenseGLClass" TEXT NOT NULL,
ADD COLUMN     "expenseOrderType" TEXT NOT NULL,
ADD COLUMN     "expenseStockType" TEXT NOT NULL;
