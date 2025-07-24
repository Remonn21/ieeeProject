/*
  Warnings:

  - You are about to drop the `_InternalRoleToPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InternalRoleToPermission" DROP CONSTRAINT "_InternalRoleToPermission_A_fkey";

-- DropForeignKey
ALTER TABLE "_InternalRoleToPermission" DROP CONSTRAINT "_InternalRoleToPermission_B_fkey";

-- DropTable
DROP TABLE "_InternalRoleToPermission";

-- CreateTable
CREATE TABLE "InternalRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "InternalRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalRolePermission_roleId_permissionId_key" ON "InternalRolePermission"("roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "InternalRolePermission" ADD CONSTRAINT "InternalRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "InternalRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalRolePermission" ADD CONSTRAINT "InternalRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
