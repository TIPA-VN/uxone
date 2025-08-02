/*
  Warnings:

  - You are about to drop the column `estimatedCost` on the `demands` table. All the data in the column will be lost.
  - You are about to drop the column `glClass` on the `demands` table. All the data in the column will be lost.
  - You are about to drop the column `itemDescription` on the `demands` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `demands` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "demands" DROP COLUMN "estimatedCost",
DROP COLUMN "glClass",
DROP COLUMN "itemDescription",
DROP COLUMN "quantity";

-- CreateTable
CREATE TABLE "demand_lines" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "unitOfMeasure" TEXT,
    "specifications" TEXT,
    "supplierPreference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_lines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demand_lines" ADD CONSTRAINT "demand_lines_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
