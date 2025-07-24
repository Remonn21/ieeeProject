/*
  Warnings:

  - You are about to drop the column `images` on the `Awards` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Awards` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Awards` table. All the data in the column will be lost.
  - Added the required column `image` to the `Awards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Awards" DROP COLUMN "images",
DROP COLUMN "name",
DROP COLUMN "year",
ADD COLUMN     "image" TEXT NOT NULL;
