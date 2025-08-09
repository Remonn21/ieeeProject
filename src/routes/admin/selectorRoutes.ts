import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import {
  getMembersSelector,
  getSeasonSelector,
} from "../../controllers/selectorController";
import { protect } from "../../controllers/authController";
import { isDataView } from "util/types";
import { isSuperAdmin } from "../../middlewares/isAdmin";

const router = Router();

router.get("/seasons", getSeasonSelector);
router.get("/members", protect, isSuperAdmin, getMembersSelector);

export default router;
