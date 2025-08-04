import { Router } from "express";

import { optionalAuth, protect } from "../../controllers/authController";

import postRoutes from "./postRoutes";
import eventRoutes from "./eventRoutes";
import { getBoard } from "../../controllers/boardController";
import { getFaqs } from "../../controllers/faqController";
import { getInsights } from "../../controllers/insightsController";
import { getAwards } from "../../controllers/awardController";
import { getCommittees } from "../../controllers/committeeController";
import { getSeasonSponsors } from "../../controllers/sponsorController";

const router = Router();

router.get("/board", getBoard);
router.use(optionalAuth);
router.use("/posts", postRoutes);
router.use("/events", eventRoutes);

router.get("/faq", getFaqs);
router.get("/insights", getInsights);
router.get("/awards", getAwards);

router.get("/sponsors", getSeasonSponsors);

router.get("/committees", getCommittees);

// app.use("/users", userRoutes);
// app.use("/company", companyRoutes);

// app.use("/subscription", subscriptionRoutes);

export default router;
