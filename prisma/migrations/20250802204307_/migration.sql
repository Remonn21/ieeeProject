/*
  Warnings:

  - Added the required column `isSeasonPartner` to the `Sponsor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "isSeasonPartner" BOOLEAN NOT NULL;
