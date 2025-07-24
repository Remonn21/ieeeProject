-- AlterEnum
ALTER TYPE "FormFieldType" ADD VALUE 'PARAGRAPH';

-- AlterTable
ALTER TABLE "CustomFormField" ADD COLUMN     "placeholder" TEXT;
