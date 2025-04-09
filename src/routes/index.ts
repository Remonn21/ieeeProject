import { Router } from "express";

import { checkAuth, createUser, login, protect } from "../controllers/authController";
// import path from "path";

import adminRoutes from "./admin";
import publicRoutes from "./public";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../validations/userValidation";

const router = Router();

// router.use("/static/images", express.static(path.join(__dirname, "../images")));

router.get("/auth/check", protect, checkAuth);
router.post("/login", login);

router.post("/create", validate(createUserSchema), createUser);

router.use("/admin", adminRoutes);

router.use("/", publicRoutes);

export default router;
