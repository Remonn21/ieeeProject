/*
  Warnings:

  - Added the required column `bio` to the `Speaker` table without a default value. This is not possible if the table is not empty.
  - Made the column `photoUrl` on table `Speaker` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Speaker" ADD COLUMN     "bio" TEXT NOT NULL,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "twitter" TEXT,
ALTER COLUMN "photoUrl" SET NOT NULL;
