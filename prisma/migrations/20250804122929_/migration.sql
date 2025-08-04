-- DropForeignKey
ALTER TABLE "EventPartner" DROP CONSTRAINT "EventPartner_photoId_fkey";

-- DropForeignKey
ALTER TABLE "EventPartner" DROP CONSTRAINT "EventPartner_sponsorId_fkey";

-- DropForeignKey
ALTER TABLE "EventSponsor" DROP CONSTRAINT "EventSponsor_photoId_fkey";

-- DropForeignKey
ALTER TABLE "EventSponsor" DROP CONSTRAINT "EventSponsor_sponsorId_fkey";

-- AddForeignKey
ALTER TABLE "EventSponsor" ADD CONSTRAINT "EventSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSponsor" ADD CONSTRAINT "EventSponsor_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "SponsorPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPartner" ADD CONSTRAINT "EventPartner_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPartner" ADD CONSTRAINT "EventPartner_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "SponsorPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
