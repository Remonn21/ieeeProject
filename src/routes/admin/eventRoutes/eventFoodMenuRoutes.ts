import { Router } from "express";

import { createUploadMiddleware } from "../../../middlewares/uploadMiddleware";

import {
  deleteEventMedia,
  getEventMedia,
} from "../../../controllers/Event/MediaController";
import {
  createFoodMenu,
  deleteFoodMenu,
  getFoodMenusForEvent,
  updateFoodMenu,
} from "../../../controllers/eventFoodController";

const router = Router();

const uploadImages = createUploadMiddleware("temp").fields([
  { name: "menuImages", maxCount: 12 },
  { name: "coverImage", maxCount: 1 },
]);

router.get("/:id/restaurants", getFoodMenusForEvent);
router.post("/:id/restaurants", uploadImages, createFoodMenu);
router.patch("/:id/restaurants/:menuId", uploadImages, updateFoodMenu);
router.delete("/:id/restaurants/:menuId", deleteFoodMenu);

export default router;
