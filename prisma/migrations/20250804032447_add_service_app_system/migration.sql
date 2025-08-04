-- CreateTable
CREATE TABLE "service_apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_tasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "externalReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_notifications" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_approvals" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "requesterId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "comments" TEXT,
    "approvalLevel" INTEGER NOT NULL DEFAULT 1,
    "requiresMultipleApprovers" BOOLEAN NOT NULL DEFAULT false,
    "approvalChain" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_apps_serviceKey_key" ON "service_apps"("serviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "service_tasks_taskId_key" ON "service_tasks"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "service_notifications_notificationId_key" ON "service_notifications"("notificationId");

-- AddForeignKey
ALTER TABLE "service_tasks" ADD CONSTRAINT "service_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tasks" ADD CONSTRAINT "service_tasks_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_notifications" ADD CONSTRAINT "service_notifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_notifications" ADD CONSTRAINT "service_notifications_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_approvals" ADD CONSTRAINT "service_approvals_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_approvals" ADD CONSTRAINT "service_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_approvals" ADD CONSTRAINT "service_approvals_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
