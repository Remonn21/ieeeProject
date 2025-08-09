import { Router } from "express";

import { getEventDetails, getEvents } from "../../controllers/eventController";
import {
  getEventRegistration,
  registerToEvent,
} from "../../controllers/eventRegistrationController";
import { optionalAuth, protect } from "../../controllers/authController";
import { isAcceptedForEventAccess } from "../../middlewares/isEventAttendee";
import { getFoodMenusForEvent } from "../../controllers/eventFoodController";
import { getEventForms } from "../../controllers/Event/FormController";
import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { submitFoodOrder } from "../../controllers/Event/OrderController";
import { validate } from "../../middlewares/validate";
import {
  createFoodOrderSchema,
  updateFoodOrderSchema,
} from "../../validations/foodOrderValidation";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventDetails);
router.get("/:eventId/forms", protect, isAcceptedForEventAccess, getEventForms);
router.get("/:id/register", getEventRegistration);
router.post(
  "/:id/register",
  optionalAuth,
  createUploadMiddleware("temp").any(),
  registerToEvent
);

router.get(
  "/:eventId/restaurants",
  protect,
  isAcceptedForEventAccess,
  getFoodMenusForEvent
);

router.post(
  "/:eventId/order-food",
  protect,
  isAcceptedForEventAccess,
  validate(createFoodOrderSchema),
  submitFoodOrder
);
router.patch(
  "/:eventId/order-food/:orderId",
  protect,
  isAcceptedForEventAccess,
  validate(updateFoodOrderSchema),
  submitFoodOrder
);

export default router;
