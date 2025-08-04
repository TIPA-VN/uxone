/*
  Warnings:

  - Made the column `serviceType` on table `service_notifications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "service_notifications" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "serviceType" SET NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

-- CreateIndex
CREATE INDEX "service_notifications_serviceId_serviceType_idx" ON "service_notifications"("serviceId", "serviceType");

-- CreateIndex
CREATE INDEX "service_notifications_notificationId_idx" ON "service_notifications"("notificationId");
