/*
  Warnings:

  - You are about to drop the column `attemptCount` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `nextRetryAt` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `responseBody` on the `webhook_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `responseCode` on the `webhook_deliveries` table. All the data in the column will be lost.
  - Added the required column `body` to the `webhook_deliveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headers` to the `webhook_deliveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `webhook_deliveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `webhook_deliveries` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `webhook_deliveries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "webhook_deliveries_nextRetryAt_idx";

-- DropIndex
DROP INDEX "webhook_deliveries_webhookId_status_idx";

-- AlterTable
ALTER TABLE "webhook_deliveries" DROP COLUMN "attemptCount",
DROP COLUMN "deliveredAt",
DROP COLUMN "nextRetryAt",
DROP COLUMN "responseBody",
DROP COLUMN "responseCode",
ADD COLUMN     "body" JSONB NOT NULL,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "headers" JSONB NOT NULL,
ADD COLUMN     "method" TEXT NOT NULL,
ADD COLUMN     "response" JSONB,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "url" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- AddForeignKey
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
