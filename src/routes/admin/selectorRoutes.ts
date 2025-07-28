import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { getSeasonSelector } from "../../controllers/selectorController";

const router = Router();

router.get("/seasons", getSeasonSelector);

export default router;
