/*
  Warnings:

  - A unique constraint covering the columns `[formId,userEmail]` on the table `CustomFormSubmission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CustomFormSubmission" ADD COLUMN     "userEmail" TEXT;

-- CreateIndex
CREATE INDEX "CustomFormSubmission_formId_userEmail_idx" ON "CustomFormSubmission"("formId", "userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFormSubmission_formId_userEmail_key" ON "CustomFormSubmission"("formId", "userEmail");
