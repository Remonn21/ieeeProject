/*
  Warnings:

  - You are about to drop the column `menuId` on the `FoodOrder` table. All the data in the column will be lost.
  - You are about to drop the `FoodMenu` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `menuId` to the `FoodOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FoodMenu" DROP CONSTRAINT "FoodMenu_eventId_fkey";

-- DropForeignKey
ALTER TABLE "FoodOrder" DROP CONSTRAINT "FoodOrder_menuId_fkey";

-- AlterTable
ALTER TABLE "FoodOrder" DROP COLUMN "menuId";

-- AlterTable
ALTER TABLE "FoodOrderItem" ADD COLUMN     "menuId" TEXT NOT NULL;

-- DropTable
DROP TABLE "FoodMenu";

-- CreateTable
CREATE TABLE "EventRestaurant" (
    "id" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "menuImages" TEXT[],

    CONSTRAINT "EventRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRestaurant_id_eventId_key" ON "EventRestaurant"("id", "eventId");

-- AddForeignKey
ALTER TABLE "EventRestaurant" ADD CONSTRAINT "EventRestaurant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "EventRestaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
