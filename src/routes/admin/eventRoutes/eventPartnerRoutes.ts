import { Router } from "express";

import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";
import {
  addEventPartner,
  deleteEventPartner,
  getEventPartners,
  updateEventPartner,
} from "../../../controllers/Event/PartnersController";

const router = Router();

export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get("/:id/partners", getEventPartners);
router.post("/:id/partners", uploadImageFile, addEventPartner);
router.patch("/:id/partners/:partnerId", uploadImageFile, updateEventPartner);
router.delete("/:eventId/partners/:partnerId", deleteEventPartner);

export default router;
