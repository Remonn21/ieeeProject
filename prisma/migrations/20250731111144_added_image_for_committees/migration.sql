-- DropIndex
DROP INDEX "CustomForm_eventId_type_idx";

-- AlterTable
ALTER TABLE "Committee" ADD COLUMN     "image" TEXT;

-- CreateIndex
CREATE INDEX "CustomForm_eventId_idx" ON "CustomForm"("eventId");
