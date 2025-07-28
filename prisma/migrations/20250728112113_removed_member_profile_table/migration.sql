/*
  Warnings:

  - You are about to drop the `MemberProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MemberProfile" DROP CONSTRAINT "MemberProfile_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "faculty" TEXT,
ADD COLUMN     "ieeeId" TEXT,
ADD COLUMN     "university" TEXT;

-- DropTable
DROP TABLE "MemberProfile";
