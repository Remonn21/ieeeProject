import { Router } from "express";

import {
  createSession,
  deleteSession,
  getSessionDetails,
  getSessions,
  updateSession,
} from "../../controllers/sessionController";
import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { checkPermission } from "../../middlewares/checkPermission";
import {
  addSpeakerPhoto,
  createSpeaker,
  getSpeakerData,
  searchSpeakers,
  updateSpeaker,
} from "../../controllers/speakersController";

const router = Router();

// router.use(authorizeRoles("EXCOM", "HEAD"));
export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get(
  "/",
  // checkPermission("speaker.index"),
  searchSpeakers
);
router.post("/", uploadImageFile, createSpeaker);
router.post("/:id/newphoto", uploadImageFile, addSpeakerPhoto);
router.patch("/:id", uploadImageFile, updateSpeaker);
// router.delete("/:id", );
router.get("/:id", getSpeakerData);

export default router;
