/*
  Warnings:

  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "roles",
ADD COLUMN     "internalRoleId" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ATTENDEE';

-- CreateTable
CREATE TABLE "InternalRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT NOT NULL,
    "roles" "Role"[],
    "internalRoleId" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "isSeasonSponsor" BOOLEAN NOT NULL,

    CONSTRAINT "Sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalRole_name_key" ON "InternalRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_group_key" ON "Permission"("name", "group");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_internalRoleId_fkey" FOREIGN KEY ("internalRoleId") REFERENCES "InternalRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_internalRoleId_fkey" FOREIGN KEY ("internalRoleId") REFERENCES "InternalRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
