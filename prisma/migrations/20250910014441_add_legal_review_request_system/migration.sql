-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "CommentPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CommentCategory" AS ENUM ('GENERAL', 'LEGAL', 'TECHNICAL', 'COMMERCIAL', 'COMPLIANCE', 'CLARIFICATION', 'SUGGESTION', 'ISSUE');

-- CreateEnum
CREATE TYPE "LegalReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'ON_HOLD';

-- AlterTable
ALTER TABLE "contract_details" ADD COLUMN     "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expirationWarningDays" INTEGER DEFAULT 30,
ADD COLUMN     "holdByUserId" TEXT,
ADD COLUMN     "holdDate" TIMESTAMP(3),
ADD COLUMN     "holdReason" TEXT,
ADD COLUMN     "isOnHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastExpirationNotice" TIMESTAMP(3),
ADD COLUMN     "renewalNoticeDays" INTEGER DEFAULT 60,
ADD COLUMN     "terminatedByUserId" TEXT,
ADD COLUMN     "terminationDate" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT;

-- CreateTable
CREATE TABLE "contract_lifecycle_events" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_comments" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "contractId" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "parentId" TEXT,
    "selectionStart" INTEGER,
    "selectionEnd" INTEGER,
    "selectedText" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "CommentPriority" NOT NULL DEFAULT 'NORMAL',
    "category" "CommentCategory" NOT NULL DEFAULT 'GENERAL',
    "legalReviewRequestId" TEXT,

    CONSTRAINT "document_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_review_requests" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" "LegalReviewStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "initialComment" TEXT,
    "finalComment" TEXT,

    CONSTRAINT "legal_review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_lifecycle_events_contractId_idx" ON "contract_lifecycle_events"("contractId");

-- CreateIndex
CREATE INDEX "contract_lifecycle_events_eventType_idx" ON "contract_lifecycle_events"("eventType");

-- CreateIndex
CREATE INDEX "contract_lifecycle_events_eventDate_idx" ON "contract_lifecycle_events"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "legal_review_requests_contractId_key" ON "legal_review_requests"("contractId");

-- CreateIndex
CREATE INDEX "contract_details_expirationDate_idx" ON "contract_details"("expirationDate");

-- CreateIndex
CREATE INDEX "contract_details_isOnHold_idx" ON "contract_details"("isOnHold");

-- CreateIndex
CREATE INDEX "contract_details_contractStatus_idx" ON "contract_details"("contractStatus");

-- AddForeignKey
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_holdByUserId_fkey" FOREIGN KEY ("holdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_terminatedByUserId_fkey" FOREIGN KEY ("terminatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_lifecycle_events" ADD CONSTRAINT "contract_lifecycle_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_lifecycle_events" ADD CONSTRAINT "contract_lifecycle_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_legalReviewRequestId_fkey" FOREIGN KEY ("legalReviewRequestId") REFERENCES "legal_review_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_review_requests" ADD CONSTRAINT "legal_review_requests_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_review_requests" ADD CONSTRAINT "legal_review_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_review_requests" ADD CONSTRAINT "legal_review_requests_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
