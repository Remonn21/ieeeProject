import { Router } from "express";

import { authorizeRoles } from "../../../middlewares/authroizeRoles";
import {
  attendUser,
  createEvent,
  getEventAttendanceStats,
  getEventDetails,
  getEventRegisteredUsers,
  getEvents,
  updateEventEssentials,
} from "../../../controllers/eventController";
import {
  createEventSchema,
  updateEventSchema,
} from "../../../validations/eventValidation";
import { validate } from "../../../middlewares/validate";
import {
  acceptEventRegistration,
  getRegisterResponseDetails,
} from "../../../controllers/eventRegistrationController";
import {
  createFoodMenu,
  getFoodMenusForEvent,
  updateFoodMenu,
} from "../../../controllers/eventFoodController";

const router = Router();
// router.use(authorizeRoles("EXCOM", "Head"));
import eventSpeakerRoutes from "./eventSpeakerRoutes";
import eventSponsorRoutes from "./eventSponsorRoutes";
import eventPartnerRoutes from "./eventPartnerRoutes";
import eventTimelineRoutes from "./eventTimelineRoutes";
import eventFormRoutes from "./eventFormRoutes";
import eventFoodMenuRoutes from "./eventFoodMenuRoutes";
import eventFoodOrderRoutes from "./foodOrderRoutes";
import eventMediaRoutes from "./eventMediaRoutes";
import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";

router.use("/", eventSpeakerRoutes);
router.use("/", eventSponsorRoutes);
router.use("/", eventFormRoutes);
router.use("/", eventPartnerRoutes);
router.use("/", eventTimelineRoutes);
router.use("/", eventMediaRoutes);
router.use("/", eventFoodMenuRoutes);
router.use("/", eventFoodOrderRoutes);

router.get("/:id/registers", getEventRegisteredUsers);
router.get("/:eventId/attendees", getEventAttendanceStats);
router.post("/:eventId/attendees", attendUser);
router.get("/responses/:responseId", getRegisterResponseDetails);
router.get("/responses/:responseId/accept-user", acceptEventRegistration);

// food orders

router.use(authorizeRoles("EXCOM"));

const uploadImageFile = createUploadMiddleware("temp").fields([
  { name: "coverImage", maxCount: 1 },
  { name: "eventVideo", maxCount: 1 },
]);

router.get("/", getEvents);
router.post("/", uploadImageFile, validate(createEventSchema), createEvent);
router.patch("/:id", uploadImageFile, validate(updateEventSchema), updateEventEssentials);

router.get("/:id", getEventDetails);

export default router;
