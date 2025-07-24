/*
  Warnings:

  - You are about to drop the column `tipaId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_tipaId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tipaId",
ADD COLUMN     "department" TEXT,
ADD COLUMN     "departmentName" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SOPeriodBacklog" (
    "id" TEXT NOT NULL,
    "week" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "backlogs" DOUBLE PRECISION NOT NULL,
    "inDock" DOUBLE PRECISION NOT NULL,
    "inProgress" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOPeriodBacklog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
