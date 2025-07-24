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

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventDetails);
router.get("/:id/register", getEventRegistration);
router.post("/:id/register", optionalAuth, registerToEvent);

router.get("/:id/food-menu", protect, isAcceptedForEventAccess, getFoodMenusForEvent);
router.post("/:id/order-food", protect, isAcceptedForEventAccess, submitFoodOrder);

export default router;
