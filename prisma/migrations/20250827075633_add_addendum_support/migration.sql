-- AlterTable
ALTER TABLE "contract_details" ADD COLUMN     "addendumNumber" INTEGER,
ADD COLUMN     "isAddendum" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentContractId" TEXT;

-- AddForeignKey
ALTER TABLE "contract_details" ADD CONSTRAINT "contract_details_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "contract_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
