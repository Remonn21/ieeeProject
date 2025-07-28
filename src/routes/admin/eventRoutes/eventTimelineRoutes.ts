import { Router } from "express";
import {
  addEventDay,
  addEventDaySession,
  deleteEventDay,
  deleteEventDaySession,
  getEventTimeline,
  updateEventDay,
  updateEventDaySession,
} from "../../../controllers/Event/TimelineController";
import { validate } from "../../../middlewares/validate";
import {
  addEventDaySchema,
  eventSessionSchema,
  updateEventDaySchema,
} from "../../../validations/timelineValidation";

const router = Router();

router.get("/:id/timeline", getEventTimeline);
router.post("/:id/timeline/", validate(addEventDaySchema), addEventDay);
router.patch("/:id/timeline/dayId", validate(updateEventDaySchema), updateEventDay);
router.delete("/:id/timeline/:dayId", deleteEventDay);

// sessions timeline routes
router.post(
  "/:eventId/timeline/:dayId/sessions",
  validate(eventSessionSchema),
  addEventDaySession
);
router.patch(
  "/:eventId/timeline/:dayId/sessions/:sessionId",
  validate(eventSessionSchema),
  updateEventDaySession
);
router.delete("/:eventId/timeline/:dayId/sessions/:sessionId", deleteEventDaySession);

export default router;
