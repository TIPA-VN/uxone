-- Drop old table and recreate with new schema
DROP TABLE IF EXISTS "users";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "name" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "department" TEXT,
    "departmentName" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email"); 