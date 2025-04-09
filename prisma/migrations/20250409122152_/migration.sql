/*
  Warnings:

  - You are about to drop the column `eventId` on the `Speaker` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Speaker" DROP CONSTRAINT "Speaker_eventId_fkey";

-- AlterTable
ALTER TABLE "Speaker" DROP COLUMN "eventId";

-- CreateTable
CREATE TABLE "_EventToSpeaker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventToSpeaker_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventToSpeaker_B_index" ON "_EventToSpeaker"("B");

-- AddForeignKey
ALTER TABLE "_EventToSpeaker" ADD CONSTRAINT "_EventToSpeaker_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToSpeaker" ADD CONSTRAINT "_EventToSpeaker_B_fkey" FOREIGN KEY ("B") REFERENCES "Speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
