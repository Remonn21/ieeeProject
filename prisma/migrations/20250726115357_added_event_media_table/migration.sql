/*
  Warnings:

  - You are about to drop the column `images` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `videos` on the `Event` table. All the data in the column will be lost.
  - Added the required column `coverImage` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('GIF', 'IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "images",
DROP COLUMN "videos",
ADD COLUMN     "coverImage" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "EventMedia" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "EventMedia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventMedia" ADD CONSTRAINT "EventMedia_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
