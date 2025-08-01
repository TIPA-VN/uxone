-- CreateTable
CREATE TABLE "department_accounts" (
    "id" SERIAL NOT NULL,
    "bu" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "account" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_accounts_bu_account_key" ON "department_accounts"("bu", "account");

-- CreateIndex
CREATE UNIQUE INDEX "department_accounts_bu_department_key" ON "department_accounts"("bu", "department");
