import { Router } from "express";

import { getEventDetails, getEvents } from "../../controllers/eventController";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventDetails);

export default router;
