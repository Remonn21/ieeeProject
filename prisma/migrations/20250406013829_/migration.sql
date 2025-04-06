/*
  Warnings:

  - You are about to drop the column `CommitteeId` on the `Session` table. All the data in the column will be lost.
  - Added the required column `committeeId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_CommitteeId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "CommitteeId",
ADD COLUMN     "committeeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
