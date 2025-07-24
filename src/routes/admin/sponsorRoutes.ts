import { Router } from "express";

import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { checkPermission } from "../../middlewares/checkPermission";
import {
  addSponsorPhoto,
  createSponsor,
  deleteSponsor,
  getSponsorData,
  searchSponsors,
} from "../../controllers/sponsorController";

const router = Router();

export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get(
  "/",
  // checkPermission("speaker.index"),
  searchSponsors
);
router.post("/", uploadImageFile, createSponsor);
router.post("/:id/newphoto", uploadImageFile, addSponsorPhoto);
router.delete("/:id", deleteSponsor);
router.get("/:id", getSponsorData);

export default router;
