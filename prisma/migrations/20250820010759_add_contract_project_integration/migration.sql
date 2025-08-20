/*
  Warnings:

  - A unique constraint covering the columns `[projectId]` on the table `contract_details` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('GENERAL', 'CONTRACT', 'SERVICE', 'MAINTENANCE', 'RESEARCH');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SIGNED', 'EXECUTING', 'COMPLETED', 'TERMINATED');

-- AlterTable
ALTER TABLE "contract_details" ADD COLUMN     "contractStatus" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "counterparty" TEXT,
ADD COLUMN     "counterpartyContact" TEXT,
ADD COLUMN     "counterpartyEmail" TEXT,
ADD COLUMN     "currentApproverId" TEXT,
ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "milestones" JSONB,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "renewalTerms" TEXT,
ALTER COLUMN "documentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "contractOwnerId" TEXT,
ADD COLUMN     "projectType" "ProjectType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "document_history" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "summary" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "changedByEmail" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_history_documentId_createdAt_idx" ON "document_history"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "contract_details_projectId_key" ON "contract_details"("projectId");

-- AddForeignKey
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_currentApproverId_fkey" FOREIGN KEY ("currentApproverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_contractOwnerId_fkey" FOREIGN KEY ("contractOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
