import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";
import {
  createBoardMember,
  deleteBoardMember,
  updateBoardMember,
} from "../../controllers/boardController";
import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";

const router = Router();

router.use(authorizeRoles("EXCOM"));

const uploadImage = createUploadMiddleware("temp").single("image");

router.post("/", uploadImage, createBoardMember);
router.patch("/:id", uploadImage, updateBoardMember);
router.delete("/:id", deleteBoardMember);

export default router;
