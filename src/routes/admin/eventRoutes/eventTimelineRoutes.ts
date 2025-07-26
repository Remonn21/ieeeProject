import { Router } from "express";
import {
  getEventTimeline,
  updateEventTimeline,
} from "../../../controllers/Event/TimelineController";

const router = Router();

router.get("/:id/timeline", getEventTimeline);
router.post("/:id/timeline", updateEventTimeline);

export default router;
