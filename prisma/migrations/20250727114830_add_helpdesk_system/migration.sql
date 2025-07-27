/*
  Warnings:

  - The values [BLOCKED] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `mentions` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `parentCommentId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `authorName` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `author` on the `project_comments` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `project_comments` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `project_comments` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `project_comments` table. All the data in the column will be lost.
  - You are about to drop the column `approvalState` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `departmentDueDates` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `released` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `releasedAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `requestDate` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `task_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `task_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedBy` on the `task_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `author` on the `task_comments` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `task_comments` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `task_comments` table. All the data in the column will be lost.
  - You are about to drop the column `blockingTaskId` on the `task_dependencies` table. All the data in the column will be lost.
  - You are about to drop the column `actualHours` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `assignedDepartments` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedHours` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dependentTaskId,dependencyTaskId]` on the table `task_dependencies` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `project_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `project_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `task_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedById` to the `task_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `task_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `task_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dependencyTaskId` to the `task_dependencies` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BUG', 'FEATURE_REQUEST', 'SUPPORT', 'TECHNICAL_ISSUE', 'GENERAL');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('AGENT', 'CUSTOMER', 'SYSTEM');

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED');
ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'TODO';
COMMIT;

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parentCommentId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_projectId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_authorId_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_comments" DROP CONSTRAINT "project_comments_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_blockingTaskId_fkey";

-- DropForeignKey
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_dependentTaskId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_ownerId_fkey";

-- DropIndex
DROP INDEX "task_dependencies_dependentTaskId_blockingTaskId_key";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "mentions",
DROP COLUMN "parentCommentId",
DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "authorId",
DROP COLUMN "authorName",
DROP COLUMN "department",
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project_comments" DROP COLUMN "author",
DROP COLUMN "text",
DROP COLUMN "timestamp",
DROP COLUMN "type",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'member';

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "approvalState",
DROP COLUMN "departmentDueDates",
DROP COLUMN "released",
DROP COLUMN "releasedAt",
DROP COLUMN "requestDate",
DROP COLUMN "tags";

-- AlterTable
ALTER TABLE "task_attachments" DROP COLUMN "size",
DROP COLUMN "uploadedAt",
DROP COLUMN "uploadedBy",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "uploadedById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "task_comments" DROP COLUMN "author",
DROP COLUMN "text",
DROP COLUMN "timestamp",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "task_dependencies" DROP COLUMN "blockingTaskId",
ADD COLUMN     "dependencyTaskId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "actualHours",
DROP COLUMN "assignedDepartments",
DROP COLUMN "createdBy",
DROP COLUMN "estimatedHours",
DROP COLUMN "tags",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "sourceTicketId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "ticketIntegration" JSONB,
ALTER COLUMN "ownerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "TicketCategory" NOT NULL DEFAULT 'SUPPORT',
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedTeam" TEXT,
    "relatedTasks" TEXT[],
    "relatedProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "responseTime" INTEGER,
    "resolutionTime" INTEGER,
    "tags" TEXT[],
    "createdById" TEXT NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL DEFAULT 'AGENT',
    "ticketId" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "ticketId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketNumber_key" ON "tickets"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_dependentTaskId_dependencyTaskId_key" ON "task_dependencies"("dependentTaskId", "dependencyTaskId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependentTaskId_fkey" FOREIGN KEY ("dependentTaskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependencyTaskId_fkey" FOREIGN KEY ("dependencyTaskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
