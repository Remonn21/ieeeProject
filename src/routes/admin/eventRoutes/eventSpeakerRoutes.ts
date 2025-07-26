import { Router } from "express";

import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";
import {
  addEventSpeaker,
  deleteEventSpeaker,
  getEventSpeakers,
  updateEventSpeaker,
} from "../../../controllers/Event/SpeakersController";

const router = Router();

export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get("/:id/speakers", getEventSpeakers);
router.post("/:id/speakers", uploadImageFile, addEventSpeaker);
router.patch("/:id/speakers/:speakerId", uploadImageFile, updateEventSpeaker);
router.delete("/:eventId/speakers/:speakerId", deleteEventSpeaker);

export default router;
