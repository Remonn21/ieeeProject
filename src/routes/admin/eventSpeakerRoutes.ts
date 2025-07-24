import { Router } from "express";

import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { checkPermission } from "../../middlewares/checkPermission";
import {
  addSpeakerPhoto,
  createSpeaker,
  getSpeakerData,
  searchSpeakers,
} from "../../controllers/speakersController";
import {
  addEventSpeaker,
  deleteEventSpeaker,
  getEventSpeakers,
} from "../../controllers/Event/SpeakersController";

const router = Router();

// router.use(authorizeRoles("EXCOM", "HEAD"));
export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get(
  "/:id/speakers",
  // checkPermission("speaker.index"),
  getEventSpeakers
);
router.post("/:id/speakers", uploadImageFile, addEventSpeaker);
router.post("/speakers/:speakerId/newphoto", uploadImageFile, addSpeakerPhoto);
router.delete("/speakers/:speakerId", deleteEventSpeaker);

export default router;
