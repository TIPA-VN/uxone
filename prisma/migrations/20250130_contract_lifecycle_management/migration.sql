-- Contract Lifecycle Management Migration
-- Add fields for expiration monitoring, hold status, and termination tracking

-- Add new fields to ContractDetails table
ALTER TABLE "contract_details" ADD COLUMN "isOnHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contract_details" ADD COLUMN "holdReason" TEXT;
ALTER TABLE "contract_details" ADD COLUMN "holdDate" TIMESTAMP(3);
ALTER TABLE "contract_details" ADD COLUMN "holdByUserId" TEXT;
ALTER TABLE "contract_details" ADD COLUMN "terminationReason" TEXT;
ALTER TABLE "contract_details" ADD COLUMN "terminationDate" TIMESTAMP(3);
ALTER TABLE "contract_details" ADD COLUMN "terminatedByUserId" TEXT;
ALTER TABLE "contract_details" ADD COLUMN "expirationWarningDays" INTEGER DEFAULT 30;
ALTER TABLE "contract_details" ADD COLUMN "autoRenewal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contract_details" ADD COLUMN "renewalNoticeDays" INTEGER DEFAULT 60;
ALTER TABLE "contract_details" ADD COLUMN "lastExpirationNotice" TIMESTAMP(3);

-- Add foreign key constraints for user references
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_holdByUserId_fkey" FOREIGN KEY ("holdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_terminatedByUserId_fkey" FOREIGN KEY ("terminatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create new ContractLifecycleEvent table for audit trail
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

-- Add foreign key constraints for ContractLifecycleEvent
ALTER TABLE "contract_lifecycle_events" ADD CONSTRAINT "contract_lifecycle_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_lifecycle_events" ADD CONSTRAINT "contract_lifecycle_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "contract_lifecycle_events_contractId_idx" ON "contract_lifecycle_events"("contractId");
CREATE INDEX "contract_lifecycle_events_eventType_idx" ON "contract_lifecycle_events"("eventType");
CREATE INDEX "contract_lifecycle_events_eventDate_idx" ON "contract_lifecycle_events"("eventDate");
CREATE INDEX "contract_details_expirationDate_idx" ON "contract_details"("expirationDate");
CREATE INDEX "contract_details_isOnHold_idx" ON "contract_details"("isOnHold");
CREATE INDEX "contract_details_contractStatus_idx" ON "contract_details"("contractStatus");

-- Update ContractStatus enum to ensure all lifecycle statuses are available
-- Note: This assumes the enum already exists, we're just documenting the expected values:
-- DRAFT, REVIEW, APPROVED, SIGNED, EXECUTING, COMPLETED, TERMINATED, ON_HOLD
