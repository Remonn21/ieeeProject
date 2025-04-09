/*
  Warnings:

  - The values [EXCOM,HEAD,COUNSELOR,VICE] on the enum `FameRank` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FameRank_new" AS ENUM ('counselor', 'excom', 'head', 'vice');
ALTER TABLE "Board" ALTER COLUMN "position" TYPE "FameRank_new" USING ("position"::text::"FameRank_new");
ALTER TYPE "FameRank" RENAME TO "FameRank_old";
ALTER TYPE "FameRank_new" RENAME TO "FameRank";
DROP TYPE "FameRank_old";
COMMIT;
