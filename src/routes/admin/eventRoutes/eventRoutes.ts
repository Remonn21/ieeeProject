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
  getEventFoodOrders,
  getFoodMenusForEvent,
  updateFoodMenu,
} from "../../../controllers/eventFoodController";

const router = Router();
// router.use(authorizeRoles("EXCOM", "Head"));
import eventSpeakerRoutes from "./eventSpeakerRoutes";
import eventSponsorRoutes from "./eventSponsorRoutes";
import eventPartnerRoutes from "./eventPartnerRoutes";
import eventTimelineRoutes from "./eventTimelineRoutes";
import eventFoodMenuRoutes from "./eventFoodMenuRoutes";
import eventMediaRoutes from "./eventMediaRoutes";
import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";

router.use("/", eventSpeakerRoutes);
router.use("/", eventSponsorRoutes);
router.use("/", eventPartnerRoutes);
router.use("/", eventTimelineRoutes);
router.use("/", eventMediaRoutes);
router.use("/", eventFoodMenuRoutes);

router.get("/:id/registers", getEventRegisteredUsers);
router.get("/:eventId/attendees", getEventAttendanceStats);
router.post("/:eventId/attendees", attendUser);
router.get("/responses/:responseId", getRegisterResponseDetails);
router.get("/responses/:responseId/accept-user", acceptEventRegistration);

// food orders
router.get("/:eventId/food-orders", getEventFoodOrders);

router.use(authorizeRoles("EXCOM"));

const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get("/", getEvents);
router.post("/", uploadImageFile, validate(createEventSchema), createEvent);
router.patch("/:id", uploadImageFile, validate(updateEventSchema), updateEventEssentials);
// router.post("/:id/essentials", createEventEssentials);
// router.patch("/:id", updateCommittee);
// router.delete("/:id", deleteCommittee);
router.get("/:id", getEventDetails);

export default router;
