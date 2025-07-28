/*
  Warnings:

  - A unique constraint covering the columns `[userId,seasonId]` on the table `SeasonMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Board_seasonId_idx" ON "Board"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonMembership_seasonId_idx" ON "SeasonMembership"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonMembership_userId_seasonId_key" ON "SeasonMembership"("userId", "seasonId");
