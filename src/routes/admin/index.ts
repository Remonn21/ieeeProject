import { Router } from "express";

import userRoutes from "./userRoutes";
import CommitteeRoutes from "./committeeRoutes";
import sessionRoutes from "./sessionRoutes";
import eventRoutes from "./eventRoutes";
import postRoutes from "./postRoutes";
import { protect } from "../../controllers/authController";

const router = Router();

router.use(protect);
router.use("/users", userRoutes);
router.use("/committees", CommitteeRoutes);
router.use("/sessions", sessionRoutes);
router.use("/events", eventRoutes);
router.use("/posts", postRoutes);

// app.use("/users", userRoutes);
// app.use("/company", companyRoutes);

// app.use("/subscription", subscriptionRoutes);

export default router;
