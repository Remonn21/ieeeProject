-- DropForeignKey
ALTER TABLE "CustomFormField" DROP CONSTRAINT "CustomFormField_formId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormResponse" DROP CONSTRAINT "CustomFormResponse_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormResponse" DROP CONSTRAINT "CustomFormResponse_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFormSubmission" DROP CONSTRAINT "CustomFormSubmission_formId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "locationLink" TEXT;

-- AddForeignKey
ALTER TABLE "CustomFormField" ADD CONSTRAINT "CustomFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormSubmission" ADD CONSTRAINT "CustomFormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomFormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFormResponse" ADD CONSTRAINT "CustomFormResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CustomFormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
