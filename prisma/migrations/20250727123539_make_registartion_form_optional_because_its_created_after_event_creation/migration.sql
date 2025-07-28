-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_registrationFormId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "registrationFormId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_registrationFormId_fkey" FOREIGN KEY ("registrationFormId") REFERENCES "CustomForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
