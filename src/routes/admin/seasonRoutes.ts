import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { validate } from "../../middlewares/validate";

import { createInsightSchema } from "../../validations/insightValidation";
import {
  createSeason,
  deleteSeason,
  getAllSeasons,
  getSeason,
  updateSeason,
} from "../../controllers/seasonController";

const router = Router();

router.use(authorizeRoles("EXCOM", "MEDIA"));
router.get("/", getAllSeasons);
router.post("/", createSeason);
router.get("/:id", getSeason);
router.patch("/:id", updateSeason);
router.delete("/:id", deleteSeason);

export default router;
