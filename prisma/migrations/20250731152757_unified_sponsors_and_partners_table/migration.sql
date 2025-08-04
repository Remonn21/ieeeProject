/*
  Warnings:

  - You are about to drop the column `partnerId` on the `EventPartner` table. All the data in the column will be lost.
  - You are about to drop the `Partner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerPhoto` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[eventId,sponsorId]` on the table `EventPartner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sponsorId` to the `EventPartner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isSeasonPartner` to the `Sponsor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EventPartner" DROP CONSTRAINT "EventPartner_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "EventPartner" DROP CONSTRAINT "EventPartner_photoId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerPhoto" DROP CONSTRAINT "PartnerPhoto_partnerId_fkey";

-- DropIndex
DROP INDEX "EventPartner_eventId_partnerId_key";

-- AlterTable
ALTER TABLE "EventPartner" DROP COLUMN "partnerId",
ADD COLUMN     "sponsorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "isSeasonPartner" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Partner";

-- DropTable
DROP TABLE "PartnerPhoto";

-- CreateIndex
CREATE UNIQUE INDEX "EventPartner_eventId_sponsorId_key" ON "EventPartner"("eventId", "sponsorId");

-- AddForeignKey
ALTER TABLE "EventPartner" ADD CONSTRAINT "EventPartner_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPartner" ADD CONSTRAINT "EventPartner_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "SponsorPhoto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
