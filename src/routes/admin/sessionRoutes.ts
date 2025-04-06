import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";
import {
  createSession,
  deleteSession,
  getSessionDetails,
  getSessions,
  updateSession,
} from "../../controllers/sessionController";
import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";

const router = Router();

// router.use(authorizeRoles("EXCOM", "HEAD"));
export const uploadImageFiles = createUploadMiddleware("temp").array("images");

router.get("/", getSessions);
router.post("/", uploadImageFiles, createSession);
router.patch("/:id", uploadImageFiles, updateSession);
router.delete("/:id", deleteSession);
router.get("/:id", getSessionDetails);

export default router;
