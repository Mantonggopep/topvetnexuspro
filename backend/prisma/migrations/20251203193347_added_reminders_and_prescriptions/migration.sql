-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "LabResult" DROP CONSTRAINT "LabResult_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Owner" DROP CONSTRAINT "Owner_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Pet" DROP CONSTRAINT "Pet_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Pet" DROP CONSTRAINT "Pet_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "SaleRecord" DROP CONSTRAINT "SaleRecord_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "reminder" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "reminders" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "vaccinations" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "SaleRecord" ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientPhone" TEXT;

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRecord" ADD CONSTRAINT "SaleRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
