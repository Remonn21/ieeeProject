/*
  Warnings:

  - You are about to drop the column `eventId` on the `AgendaItem` table. All the data in the column will be lost.
  - Added the required column `eventDayId` to the `AgendaItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speakerId` to the `AgendaItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AgendaItem" DROP CONSTRAINT "AgendaItem_eventId_fkey";

-- AlterTable
ALTER TABLE "AgendaItem" DROP COLUMN "eventId",
ADD COLUMN     "eventDayId" TEXT NOT NULL,
ADD COLUMN     "speakerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "EventDay" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventDay" ADD CONSTRAINT "EventDay_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_eventDayId_fkey" FOREIGN KEY ("eventDayId") REFERENCES "EventDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
