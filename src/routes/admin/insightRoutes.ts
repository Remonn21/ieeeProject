import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { validate } from "../../middlewares/validate";
import {
  createInsight,
  deleteInsight,
  getInsights,
  updateInsight,
} from "../../controllers/insightsController";
import { createInsightSchema } from "../../validations/insightValidation";

const router = Router();

router.get("/", getInsights);

router.use(authorizeRoles("EXCOM", "MEDIA"));
router.post("/", validate(createInsightSchema), createInsight);
router.patch("/:id", validate(createInsightSchema), updateInsight);
router.delete("/:id", deleteInsight);

export default router;
