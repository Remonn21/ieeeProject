/*
  Warnings:

  - You are about to drop the `_EventToSpeaker` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EventToSpeaker" DROP CONSTRAINT "_EventToSpeaker_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventToSpeaker" DROP CONSTRAINT "_EventToSpeaker_B_fkey";

-- DropTable
DROP TABLE "_EventToSpeaker";

-- CreateTable
CREATE TABLE "EventSpeaker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "photoId" TEXT,

    CONSTRAINT "EventSpeaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakerPhoto" (
    "id" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "SpeakerPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSpeaker_eventId_speakerId_key" ON "EventSpeaker"("eventId", "speakerId");

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "SpeakerPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerPhoto" ADD CONSTRAINT "SpeakerPhoto_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
