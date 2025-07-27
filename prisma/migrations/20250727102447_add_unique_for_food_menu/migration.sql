/*
  Warnings:

  - A unique constraint covering the columns `[id,eventId]` on the table `FoodMenu` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FoodMenu_id_eventId_key" ON "FoodMenu"("id", "eventId");
