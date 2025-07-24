-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_formId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "formId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
