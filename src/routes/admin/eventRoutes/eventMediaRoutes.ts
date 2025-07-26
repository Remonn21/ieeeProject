import { Router } from "express";

import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";

import {
  deleteEventMedia,
  getEventMedia,
  UploadEventMedia,
} from "../../../controllers/Event/MediaController";

const router = Router();

export const uploadMedia = createUploadMiddleware("temp").array("media", 15);

router.get("/:id/media", getEventMedia);
router.post("/:id/media", uploadMedia, UploadEventMedia);
router.delete("/:eventId/media/:photoId", deleteEventMedia);

export default router;
