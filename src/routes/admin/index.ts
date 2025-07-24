import { Router } from "express";

import userRoutes from "./userRoutes";
import CommitteeRoutes from "./committeeRoutes";
import sessionRoutes from "./sessionRoutes";
import eventRoutes from "./eventRoutes";
import postRoutes from "./postRoutes";
import boardRoutes from "./boardRoutes";
import faqRoutes from "./faqRoutes";
import insightRoutes from "./insightRoutes";
import speakerRoutes from "./speakerRoutes";
import formRoutes from "./formRoutes";
import awardRoutes from "./awardRoutes";
import sponsorRoutes from "./sponsorRoutes";
import partnerRoutes from "./partnerRoutes";
import { optionalAuth, protect } from "../../controllers/authController";

const router = Router();

// router.use(optionalAuth);
router.use(protect); //TODO:BACK IT LATER
router.use("/users", userRoutes);
router.use("/committees", CommitteeRoutes);
router.use("/sessions", sessionRoutes);
router.use("/events", eventRoutes);
router.use("/speakers", speakerRoutes);
router.use("/posts", postRoutes);
router.use("/board", boardRoutes);
router.use("/forms", formRoutes);
router.use("/faq", faqRoutes);
router.use("/insights", insightRoutes);
router.use("/awards", awardRoutes);
router.use("/partners", partnerRoutes);
router.use("/sponsors", sponsorRoutes);

// app.use("/users", userRoutes);
// app.use("/company", companyRoutes);

// app.use("/subscription", subscriptionRoutes);

export default router;
