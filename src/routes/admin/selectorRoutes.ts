import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import {
  getMembersSelector,
  getSeasonSelector,
} from "../../controllers/selectorController";

const router = Router();

router.get("/seasons", getSeasonSelector);
router.get("/members", getMembersSelector);

export default router;
