/*
  Warnings:

  - You are about to drop the `FoodItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FoodOrderItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `items` to the `FoodOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menuId` to the `FoodOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FoodItem" DROP CONSTRAINT "FoodItem_menuId_fkey";

-- DropForeignKey
ALTER TABLE "FoodOrderItem" DROP CONSTRAINT "FoodOrderItem_foodItemId_fkey";

-- DropForeignKey
ALTER TABLE "FoodOrderItem" DROP CONSTRAINT "FoodOrderItem_orderId_fkey";

-- AlterTable
ALTER TABLE "EventMedia" ADD COLUMN     "caption" TEXT;

-- AlterTable
ALTER TABLE "FoodMenu" ADD COLUMN     "images" TEXT[];

-- AlterTable
ALTER TABLE "FoodOrder" ADD COLUMN     "items" TEXT NOT NULL,
ADD COLUMN     "menuId" TEXT NOT NULL,
ADD COLUMN     "price" TEXT;

-- DropTable
DROP TABLE "FoodItem";

-- DropTable
DROP TABLE "FoodOrderItem";

-- AddForeignKey
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "FoodMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
