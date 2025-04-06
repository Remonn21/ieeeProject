import { Router } from "express";

import {
  createCommittee,
  deleteCommittee,
  getCommitteeDetails,
  getCommittees,
  updateCommittee,
} from "../../controllers/committeeController";
import { authorizeRoles } from "../../middlewares/authroizeRoles";

const router = Router();

router.use(authorizeRoles("EXCOM"));

router.get("/", getCommittees);
router.post("/", createCommittee);
router.patch("/:id", updateCommittee);
router.delete("/:id", deleteCommittee);
router.get("/:id", getCommitteeDetails);

export default router;
