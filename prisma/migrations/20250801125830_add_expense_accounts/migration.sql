-- CreateTable
CREATE TABLE "expense_accounts" (
    "id" SERIAL NOT NULL,
    "account" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "glClass" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "bu" INTEGER NOT NULL,
    "stockType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_accounts_account_businessName_orderType_bu_key" ON "expense_accounts"("account", "businessName", "orderType", "bu");
