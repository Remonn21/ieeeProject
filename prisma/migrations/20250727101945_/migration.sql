/*
  Warnings:

  - You are about to drop the column `images` on the `FoodMenu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FoodMenu" DROP COLUMN "images",
ADD COLUMN     "menuImages" TEXT[];
