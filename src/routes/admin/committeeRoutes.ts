import { Router } from "express";

import {
  createCommittee,
  deleteCommittee,
  getCommitteeDetails,
  getCommittees,
  updateCommittee,
} from "../../controllers/committeeController";
import { authorizeRoles } from "../../middlewares/authroizeRoles";
import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { validate } from "../../middlewares/validate";
import {
  createCommitteeSchema,
  updateCommitteeSchema,
} from "../../validations/committeeValidation";

const router = Router();

router.use(authorizeRoles("EXCOM"));
export const uploadImageFile = createUploadMiddleware("temp").single("image");

router.get("/", getCommittees);
router.post("/", uploadImageFile, validate(createCommitteeSchema), createCommittee);
router.patch("/:id", uploadImageFile, validate(updateCommitteeSchema), updateCommittee);
router.delete("/:id", deleteCommittee);
router.get("/:id", getCommitteeDetails);

export default router;
