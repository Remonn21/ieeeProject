import { Router } from "express";

import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { checkPermission } from "../../middlewares/checkPermission";
import {
  addPartnerPhoto,
  createPartner,
  deletePartner,
  getPartnerData,
  searchPartners,
  updatePartner,
} from "../../controllers/partnerController";

const router = Router();

export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get(
  "/",
  // checkPermission("speaker.index"),
  searchPartners
);
router.post("/", uploadImageFile, createPartner);
router.patch("/:id/", uploadImageFile, updatePartner);
router.post("/:id/newphoto", uploadImageFile, addPartnerPhoto);
router.delete("/:id", deletePartner);
router.get("/:id", getPartnerData);

export default router;
