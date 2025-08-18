-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REGULAR_DOCUMENT', 'CONTRACT', 'TEMPLATE', 'FORM', 'REFERENCE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PURCHASE_CONTRACT', 'LOGISTICS_AGREEMENT', 'PRICING_AGREEMENT', 'LEGAL_DISPUTE', 'MOQ_AGREEMENT', 'SERVICE_AGREEMENT', 'EMPLOYMENT_CONTRACT', 'NDA', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMMENTED');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('ACTIVE_ARCHIVE', 'COLD_ARCHIVE', 'COMPLIANCE_ARCHIVE', 'BACKUP_ARCHIVE');

-- CreateEnum
CREATE TYPE "RetentionPolicy" AS ENUM ('LEGAL_REQUIREMENT', 'BUSINESS_NEED', 'SHORT_TERM', 'LONG_TERM', 'PERMANENT');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('INSERT', 'DELETE', 'FORMAT', 'COMMENT', 'MOVE', 'REPLACE');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "content" TEXT,
ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'REGULAR_DOCUMENT',
ADD COLUMN     "isEditable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "lastUpdatedById" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "contract_details" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "contractNumber" TEXT,
    "contractType" "ContractType",
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "currentApprovalLevel" INTEGER NOT NULL DEFAULT 1,
    "totalApprovalLevels" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "value" DECIMAL(15,2),
    "currency" TEXT DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_approvals" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_revisions" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "diff" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeSummary" TEXT NOT NULL,
    "changeCount" INTEGER NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "contract_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finalized_documents" (
    "id" TEXT NOT NULL,
    "originalDocumentId" TEXT NOT NULL,
    "finalizedContent" TEXT NOT NULL,
    "finalizedHtml" TEXT,
    "finalizedPdf" TEXT,
    "approvedBy" TEXT[],
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "finalizationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "contractNumber" TEXT,
    "version" INTEGER NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "digitalSignature" TEXT,
    "checksum" TEXT NOT NULL,
    "isLegallyBinding" BOOLEAN NOT NULL DEFAULT true,
    "storageLocation" TEXT NOT NULL,
    "storageType" "StorageType" NOT NULL DEFAULT 'ACTIVE_ARCHIVE',
    "compressionRatio" DOUBLE PRECISION,
    "finalizationNotes" TEXT,
    "archivedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finalized_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_archives" (
    "id" TEXT NOT NULL,
    "finalizedDocumentId" TEXT NOT NULL,
    "archiveNumber" TEXT NOT NULL,
    "archiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archiveReason" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "backupLocation" TEXT,
    "retentionPolicy" "RetentionPolicy" NOT NULL DEFAULT 'LEGAL_REQUIREMENT',
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'RESTRICTED',
    "authorizedUsers" TEXT[],

    CONSTRAINT "document_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_changes" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revisionId" TEXT,
    "changeType" "ChangeType" NOT NULL,
    "position" INTEGER NOT NULL,
    "oldContent" TEXT,
    "newContent" TEXT,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "document_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_details_documentId_key" ON "contract_details"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_details_contractNumber_key" ON "contract_details"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contract_approvals_contractId_approverId_level_key" ON "contract_approvals"("contractId", "approverId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "contract_revisions_contractId_version_revisionNumber_key" ON "contract_revisions"("contractId", "version", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "finalized_documents_originalDocumentId_key" ON "finalized_documents"("originalDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_archives_archiveNumber_key" ON "document_archives"("archiveNumber");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_revisions" ADD CONSTRAINT "contract_revisions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_revisions" ADD CONSTRAINT "contract_revisions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finalized_documents" ADD CONSTRAINT "finalized_documents_originalDocumentId_fkey" FOREIGN KEY ("originalDocumentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finalized_documents" ADD CONSTRAINT "finalized_documents_archivedBy_fkey" FOREIGN KEY ("archivedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_archives" ADD CONSTRAINT "document_archives_finalizedDocumentId_fkey" FOREIGN KEY ("finalizedDocumentId") REFERENCES "finalized_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_changes" ADD CONSTRAINT "document_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_changes" ADD CONSTRAINT "document_changes_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "contract_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
