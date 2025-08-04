/*
  Warnings:

  - You are about to drop the column `approvalChain` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `approvalLevel` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `approverId` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `requestType` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `service_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `requiresMultipleApprovers` on the `service_approvals` table. All the data in the column will be lost.
  - Added the required column `approvalType` to the `service_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `approvers` to the `service_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `service_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `service_approvals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "service_approvals" DROP CONSTRAINT "service_approvals_approverId_fkey";

-- DropForeignKey
ALTER TABLE "service_approvals" DROP CONSTRAINT "service_approvals_requesterId_fkey";

-- AlterTable
ALTER TABLE "service_approvals" DROP COLUMN "approvalChain",
DROP COLUMN "approvalLevel",
DROP COLUMN "approvedAt",
DROP COLUMN "approverId",
DROP COLUMN "comments",
DROP COLUMN "department",
DROP COLUMN "rejectedAt",
DROP COLUMN "requestId",
DROP COLUMN "requestType",
DROP COLUMN "requesterId",
DROP COLUMN "requiresMultipleApprovers",
ADD COLUMN     "approvalType" TEXT NOT NULL,
ADD COLUMN     "approvers" JSONB NOT NULL,
ADD COLUMN     "currentLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "serviceType" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "totalLevels" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "service_approval_decisions" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "decisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_approval_decisions_approvalId_idx" ON "service_approval_decisions"("approvalId");

-- CreateIndex
CREATE INDEX "service_approval_decisions_approverId_idx" ON "service_approval_decisions"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "service_approval_decisions_approvalId_approverId_level_key" ON "service_approval_decisions"("approvalId", "approverId", "level");

-- CreateIndex
CREATE INDEX "service_approvals_serviceId_serviceType_idx" ON "service_approvals"("serviceId", "serviceType");

-- CreateIndex
CREATE INDEX "service_approvals_status_priority_idx" ON "service_approvals"("status", "priority");

-- CreateIndex
CREATE INDEX "service_approvals_externalId_idx" ON "service_approvals"("externalId");

-- AddForeignKey
ALTER TABLE "service_approval_decisions" ADD CONSTRAINT "service_approval_decisions_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "service_approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_approval_decisions" ADD CONSTRAINT "service_approval_decisions_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
