import { Router } from "express";

import userRoutes from "./userRoutes";
import CommitteeRoutes from "./committeeRoutes";
import sessionRoutes from "./sessionRoutes";
import eventRoutes from "./eventRoutes/eventRoutes";
import postRoutes from "./postRoutes";
import boardRoutes from "./boardRoutes";
import faqRoutes from "./faqRoutes";
import insightRoutes from "./insightRoutes";
import speakerRoutes from "./speakerRoutes";
import formRoutes from "./formRoutes";
import awardRoutes from "./awardRoutes";
import sponsorRoutes from "./sponsorRoutes";
import partnerRoutes from "./partnerRoutes";
import memberRoutes from "./memberRoutes";
import seasonRoutes from "./seasonRoutes";
import selectorRoutes from "./selectorRoutes";
import { protect } from "../../controllers/authController";

const router = Router();

router.use(protect);
router.use("/selectors", selectorRoutes);

router.use("/users", userRoutes); //TODO:remove the create from here
router.use("/members", memberRoutes);
router.use("/committees", CommitteeRoutes);
router.use("/seasons", seasonRoutes);
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
