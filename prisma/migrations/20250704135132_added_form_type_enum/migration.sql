/*
  Warnings:

  - The `type` column on the `CustomForm` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('EVENT', 'SURVEY', 'FEEDBACK', 'POST', 'ANY');

-- AlterTable
ALTER TABLE "CustomForm" DROP COLUMN "type",
ADD COLUMN     "type" "FormType" NOT NULL DEFAULT 'ANY';
