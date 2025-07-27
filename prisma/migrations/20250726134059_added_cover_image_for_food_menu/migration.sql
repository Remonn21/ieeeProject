/*
  Warnings:

  - Added the required column `coverImage` to the `FoodMenu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FoodMenu" ADD COLUMN     "coverImage" TEXT NOT NULL;
