-- DropForeignKey
ALTER TABLE "AgendaItem" DROP CONSTRAINT "AgendaItem_eventDayId_fkey";

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_eventDayId_fkey" FOREIGN KEY ("eventDayId") REFERENCES "EventDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
