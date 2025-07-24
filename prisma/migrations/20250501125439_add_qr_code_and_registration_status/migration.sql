-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "qrcode" TEXT,
ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'pending';
