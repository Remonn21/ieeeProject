import { Router } from "express";

import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import {
  createAward,
  deleteAward,
  getAwards,
  updateAward,
} from "../../controllers/awardController";
import { checkPermission } from "../../middlewares/checkPermission";
import { validate } from "../../middlewares/validate";
import { createAwardSchema } from "../../validations/awardValidation";

const router = Router();

export const uploadAwardFile = createUploadMiddleware("temp").single("image");

router.post(
  "/",
  checkPermission("award.create"),
  uploadAwardFile,
  validate(createAwardSchema),
  createAward
);
router.patch(
  "/:id",
  checkPermission("award.update"),
  uploadAwardFile,
  validate(createAwardSchema),
  updateAward
);
router.delete("/:id", checkPermission("award.delete"), deleteAward);

router.get("/", checkPermission("award.show"), getAwards);
// router.get("/:id", checkPermission("award.show"), getAwardDetails);

// router.patch("/:id", updateMediaFiles, updateEvent);

export default router;
