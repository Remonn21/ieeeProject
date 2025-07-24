-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'rejected', 'accepted');

-- AlterTable
ALTER TABLE "FoodOrder" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_userId_status_idx" ON "EventRegistration"("eventId", "userId", "status");
