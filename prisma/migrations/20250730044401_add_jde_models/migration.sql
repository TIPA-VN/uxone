-- CreateTable
CREATE TABLE "item_master" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "leadTime" INTEGER NOT NULL,
    "safetyStock" INTEGER NOT NULL,
    "minOrderQty" INTEGER NOT NULL,
    "maxOrderQty" INTEGER NOT NULL,
    "lotSize" INTEGER NOT NULL,
    "costCenter" TEXT NOT NULL,
    "planner" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_location" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL,
    "quantityOnOrder" INTEGER NOT NULL,
    "quantityCommitted" INTEGER NOT NULL,
    "lastCountDate" TIMESTAMP(3),
    "lastCountQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_header" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "promiseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_header_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_detail" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "extendedPrice" DECIMAL(65,30) NOT NULL,
    "promiseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_detail" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "quantityReceived" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "lotNumber" TEXT,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_message" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mrp_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_detail" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityShipped" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "promiseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendation" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecast" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessment" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "impact" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mitigation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sync_log" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsProcessed" INTEGER NOT NULL,
    "recordsFailed" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_master_itemNumber_key" ON "item_master"("itemNumber");

-- CreateIndex
CREATE UNIQUE INDEX "item_location_itemNumber_branch_location_key" ON "item_location"("itemNumber", "branch", "location");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_header_poNumber_key" ON "purchase_order_header"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_detail_poNumber_lineNumber_key" ON "purchase_order_detail"("poNumber", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_detail_receiptNumber_lineNumber_key" ON "receipt_detail"("receiptNumber", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_detail_orderNumber_lineNumber_key" ON "sales_order_detail"("orderNumber", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "demand_forecast_itemNumber_forecastDate_period_key" ON "demand_forecast"("itemNumber", "forecastDate", "period");

-- AddForeignKey
ALTER TABLE "item_location" ADD CONSTRAINT "item_location_itemNumber_fkey" FOREIGN KEY ("itemNumber") REFERENCES "item_master"("itemNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_detail" ADD CONSTRAINT "purchase_order_detail_poNumber_fkey" FOREIGN KEY ("poNumber") REFERENCES "purchase_order_header"("poNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_detail" ADD CONSTRAINT "purchase_order_detail_itemNumber_fkey" FOREIGN KEY ("itemNumber") REFERENCES "item_master"("itemNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_detail" ADD CONSTRAINT "receipt_detail_poNumber_lineNumber_fkey" FOREIGN KEY ("poNumber", "lineNumber") REFERENCES "purchase_order_detail"("poNumber", "lineNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_detail" ADD CONSTRAINT "receipt_detail_itemNumber_fkey" FOREIGN KEY ("itemNumber") REFERENCES "item_master"("itemNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_message" ADD CONSTRAINT "mrp_message_itemNumber_fkey" FOREIGN KEY ("itemNumber") REFERENCES "item_master"("itemNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_detail" ADD CONSTRAINT "sales_order_detail_itemNumber_fkey" FOREIGN KEY ("itemNumber") REFERENCES "item_master"("itemNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
