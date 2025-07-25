import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";
import {
  createBoardMember,
  deleteBoardMember,
  updateBoardMember,
} from "../../controllers/boardController";
import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import {
  createBoardMemberSchema,
  updateBoardMemberSchema,
} from "../../validations/boardValidation";
import { validate } from "../../middlewares/validate";

const router = Router();

router.use(authorizeRoles("EXCOM"));

const uploadImage = createUploadMiddleware("temp").single("image");

router.post("/", uploadImage, validate(createBoardMemberSchema), createBoardMember);
router.patch("/:id", uploadImage, validate(updateBoardMemberSchema), updateBoardMember);
router.delete("/:id", deleteBoardMember);

export default router;
