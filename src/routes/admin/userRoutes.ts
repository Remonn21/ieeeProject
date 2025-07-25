import { Router } from "express";

import { checkAuth, login, protect, createUser } from "../../controllers/authController";

const router = Router();

router.get("/auth/check", protect, checkAuth);
router.post("/login", login);

// app.use("/users", userRoutes);
// app.use("/company", companyRoutes);

// app.use("/subscription", subscriptionRoutes);

export default router;
