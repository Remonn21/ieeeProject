/*
  Warnings:

  - You are about to drop the column `menuId` on the `FoodOrderItem` table. All the data in the column will be lost.
  - Added the required column `restaurantId` to the `FoodOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FoodOrderItem" DROP CONSTRAINT "FoodOrderItem_menuId_fkey";

-- AlterTable
ALTER TABLE "FoodOrderItem" DROP COLUMN "menuId",
ADD COLUMN     "restaurantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "EventRestaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
