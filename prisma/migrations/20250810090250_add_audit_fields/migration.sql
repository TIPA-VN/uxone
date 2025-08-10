-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "lastUpdatedById" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "lastUpdatedById" TEXT;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "lastUpdatedById" TEXT;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
