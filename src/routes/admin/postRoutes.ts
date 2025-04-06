import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { createUploadMiddleware } from "../../middlewares/uploadMiddleware";
import { createPost, deletePost } from "../../controllers/postController";

const router = Router();

export const updateMediaFiles = createUploadMiddleware("temp").fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 2 },
]);

router.use(authorizeRoles("EXCOM", "MEDIA"));
router.post("/", updateMediaFiles, createPost);

router.delete("/:id", deletePost);
// router.patch("/:id", updateMediaFiles, updateEvent);

export default router;
