/*
  Warnings:

  - The values [Conference,Workshop,Meetup] on the enum `EventCategory` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `socialLinks` on the `Board` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventCategory_new" AS ENUM ('event', 'bootcamp', 'workshop', 'outing');
ALTER TABLE "Event" ALTER COLUMN "category" TYPE "EventCategory_new" USING ("category"::text::"EventCategory_new");
ALTER TYPE "EventCategory" RENAME TO "EventCategory_old";
ALTER TYPE "EventCategory_new" RENAME TO "EventCategory";
DROP TYPE "EventCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Board" DROP COLUMN "socialLinks",
ADD COLUMN     "socialLinks" JSONB NOT NULL;
