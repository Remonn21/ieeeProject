/*
  Warnings:

  - A unique constraint covering the columns `[registrationFormId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registrationFormId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "registrationFormId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Event_registrationFormId_key" ON "Event"("registrationFormId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_registrationFormId_fkey" FOREIGN KEY ("registrationFormId") REFERENCES "CustomForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
