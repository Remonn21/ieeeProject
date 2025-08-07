/*
  Warnings:

  - You are about to drop the column `comment` on the `FoodOrder` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `FoodOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FoodOrder" DROP COLUMN "comment",
DROP COLUMN "items",
ADD COLUMN     "additionalNotes" TEXT;

-- CreateTable
CREATE TABLE "FoodOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "FoodOrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
