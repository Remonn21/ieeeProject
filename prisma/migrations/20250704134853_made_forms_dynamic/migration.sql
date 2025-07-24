/*
  Warnings:

  - You are about to drop the column `eventId` on the `CustomFormField` table. All the data in the column will be lost.
  - You are about to drop the column `registrationId` on the `CustomFormResponse` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[formId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[submissionId]` on the table `EventRegistration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `formId` to the `CustomFormField` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submissionId` to the `CustomFormResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FormFieldType" ADD VALUE 'DROPDOWN';
ALTER TYPE "FormFieldType" ADD VALUE 'OPTIONS';

-- DropForeignKey
ALTER TABLE "CustomFormField" DROP CONSTRAINT "CustomFormField_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormResponse" DROP CONSTRAINT "CustomFormResponse_registrationId_fkey";

-- AlterTable
ALTER TABLE "CustomFormField" DROP COLUMN "eventId",
ADD COLUMN     "formId" TEXT NOT NULL,
ADD COLUMN     "max" INTEGER,
ADD COLUMN     "min" INTEGER,
ADD COLUMN     "pattern" TEXT;

-- AlterTable
ALTER TABLE "CustomFormResponse" DROP COLUMN "registrationId",
ADD COLUMN     "submissionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "formId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "submissionId" TEXT;

-- CreateTable
CREATE TABLE "CustomForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,

    CONSTRAINT "CustomForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_formId_key" ON "Event"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_submissionId_key" ON "EventRegistration"("submissionId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CustomFormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormField" ADD CONSTRAINT "CustomFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormSubmission" ADD CONSTRAINT "CustomFormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormSubmission" ADD CONSTRAINT "CustomFormSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CustomFormSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
