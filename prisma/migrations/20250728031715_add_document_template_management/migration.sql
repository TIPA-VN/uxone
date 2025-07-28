-- CreateEnum
CREATE TYPE "DocumentNumberStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "currentSequence" INTEGER NOT NULL DEFAULT 0,
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2025,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_numbers" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "projectId" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "DocumentNumberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_templateCode_key" ON "document_templates"("templateCode");

-- CreateIndex
CREATE UNIQUE INDEX "document_numbers_documentNumber_key" ON "document_numbers"("documentNumber");

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_numbers" ADD CONSTRAINT "document_numbers_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_numbers" ADD CONSTRAINT "document_numbers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_numbers" ADD CONSTRAINT "document_numbers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
