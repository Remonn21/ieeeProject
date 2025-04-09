import { Router } from "express";

import { optionalAuth, protect } from "../../controllers/authController";

import postRoutes from "./postRoutes";
import eventRoutes from "./eventRoutes";
import { getBoard } from "../../controllers/boardController";

const router = Router();

router.get("/board", getBoard);
router.use(optionalAuth);
router.use("/posts", postRoutes);
router.use("/events", eventRoutes);

// app.use("/users", userRoutes);
// app.use("/company", companyRoutes);

// app.use("/subscription", subscriptionRoutes);

export default router;
