-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('ABSENT', 'PRESENT', 'LATE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
ALTER COLUMN "attendedAt" DROP NOT NULL,
ALTER COLUMN "attendedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
