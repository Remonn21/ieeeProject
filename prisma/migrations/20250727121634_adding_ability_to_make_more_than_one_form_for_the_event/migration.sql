/*
  Warnings:

  - You are about to drop the column `formId` on the `Event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,isRegistrationForm]` on the table `CustomForm` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CustomFormField" DROP CONSTRAINT "CustomFormField_formId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_formId_fkey";

-- DropIndex
DROP INDEX "Event_formId_key";

-- AlterTable
ALTER TABLE "CustomForm" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isRegistrationForm" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CustomFormField" ALTER COLUMN "formId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "formId";

-- CreateIndex
CREATE INDEX "CustomForm_eventId_type_idx" ON "CustomForm"("eventId", "type");

-- CreateIndex
CREATE INDEX "CustomForm_eventId_isRegistrationForm_idx" ON "CustomForm"("eventId", "isRegistrationForm");

-- CreateIndex
CREATE UNIQUE INDEX "CustomForm_eventId_isRegistrationForm_key" ON "CustomForm"("eventId", "isRegistrationForm");

-- AddForeignKey
ALTER TABLE "CustomForm" ADD CONSTRAINT "CustomForm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormField" ADD CONSTRAINT "CustomFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
