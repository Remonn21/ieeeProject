import { Router } from "express";

import { getEventDetails, getEvents } from "../../controllers/eventController";
import {
  getEventRegistration,
  registerToEvent,
} from "../../controllers/eventRegistrationController";
import { optionalAuth, protect } from "../../controllers/authController";
import { isAcceptedForEventAccess } from "../../middlewares/isEventAttendee";
import {
  getFoodMenusForEvent,
  submitFoodOrder,
} from "../../controllers/eventFoodController";
import { getEventForms } from "../../controllers/Event/FormController";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventDetails);
router.get("/:eventId/forms", protect, isAcceptedForEventAccess, getEventForms);
router.get("/:id/register", getEventRegistration);
router.post("/:id/register", optionalAuth, registerToEvent);

router.get(
  "/:eventId/food-menu",
  protect,
  isAcceptedForEventAccess,
  getFoodMenusForEvent
);
router.post("/:eventId/order-food", protect, isAcceptedForEventAccess, submitFoodOrder);

export default router;
