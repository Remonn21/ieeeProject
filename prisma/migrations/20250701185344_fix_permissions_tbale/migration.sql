/*
  Warnings:

  - You are about to drop the column `internalRoleId` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `Permission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_internalRoleId_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "internalRoleId",
DROP COLUMN "roles";

-- CreateTable
CREATE TABLE "_InternalRoleToPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InternalRoleToPermission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InternalRoleToPermission_B_index" ON "_InternalRoleToPermission"("B");

-- AddForeignKey
ALTER TABLE "_InternalRoleToPermission" ADD CONSTRAINT "_InternalRoleToPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "InternalRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InternalRoleToPermission" ADD CONSTRAINT "_InternalRoleToPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
