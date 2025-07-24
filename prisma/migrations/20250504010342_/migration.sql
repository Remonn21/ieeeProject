/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "personalEmail" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");
