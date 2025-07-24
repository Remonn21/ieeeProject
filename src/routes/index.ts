import { Router } from "express";

import {
  checkAuth,
  createUser,
  login,
  logout,
  protect,
} from "../controllers/authController";
// import path from "path";

import adminRoutes from "./admin";
import publicRoutes from "./public";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../validations/userValidation";

import express from "express";
import path from "path";

const router = Router();

router.get("/auth/check", protect, checkAuth);
router.post("/login", login);
router.post("/logout", protect, logout);
router.use("/", publicRoutes);

router.post("/create", validate(createUserSchema), createUser);

router.use("/admin", adminRoutes);

export default router;
