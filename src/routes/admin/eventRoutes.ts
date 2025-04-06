import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";
import {
  createEvent,
  getEventDetails,
  getEvents,
} from "../../controllers/eventController";

const router = Router();

router.use(authorizeRoles("EXCOM"));

router.get("/", getEvents);
router.post("/", createEvent);
// router.patch("/:id", updateCommittee);
// router.delete("/:id", deleteCommittee);
router.get("/:id", getEventDetails);

export default router;
