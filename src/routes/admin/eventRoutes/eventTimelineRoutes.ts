import { Router } from "express";
import {
  addEventDay,
  addEventDaySession,
  deleteEventDay,
  deleteEventDaySession,
  getEventTimeline,
} from "../../../controllers/Event/TimelineController";
import { validate } from "../../../middlewares/validate";
import {
  addEventDaySchema,
  eventSessionSchema,
} from "../../../validations/timelineValidation";

const router = Router();

router.get("/:id/timeline", getEventTimeline);
router.post("/:id/timeline/", validate(addEventDaySchema), addEventDay);
router.delete("/:id/timeline/:dayId", deleteEventDay);
router.post(
  "/:eventId/timeline/:dayId/sessions",
  validate(eventSessionSchema),
  addEventDaySession
);
router.delete("/:eventId/timeline/:dayId/sessions/:sessionId", deleteEventDaySession);

export default router;
