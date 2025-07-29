import { Router } from "express";

import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";
import { getEventForms, getFormDetails } from "../../../controllers/Event/FormController";

const router = Router();

const uploadImages = createUploadMiddleware("temp").fields([
  { name: "menuImages", maxCount: 12 },
  { name: "coverImage", maxCount: 1 },
]);

router.get("/:id/forms", getEventForms);
router.get("/:id/forms/:formId", uploadImages, getFormDetails);

export default router;
