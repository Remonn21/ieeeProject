import { Router } from "express";

import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";
import {
  addEventSponsor,
  deleteEventSponsor,
  getEventSponsors,
  updateEventSponsor,
} from "../../../controllers/Event/SponsorsController";

const router = Router();

export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get("/:id/sponsors", getEventSponsors);
router.post("/:id/sponsors", uploadImageFile, addEventSponsor);
router.patch("/:id/sponsors/:sponsorId", uploadImageFile, updateEventSponsor);
router.delete("/:eventId/sponsors/:sponsorId", deleteEventSponsor);

export default router;
