import express from "express";

import { checkPermission } from "../../middlewares/checkPermission";
import {
  createMember,
  deleteMember,
  getMemberDetails,
  getMembers,
  toggleMemberStatus,
  updateMember,
} from "../../controllers/memberController";
import { validate } from "../../middlewares/validate";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../../validations/memberValidation";

const router = express.Router();

router.get("/", getMembers);
router.get("/:id", getMemberDetails);
router.get("/:id/toggle-status", checkPermission("member.update"), toggleMemberStatus);
router.post(
  "/",
  checkPermission("member.create"),
  validate(createMemberSchema),
  createMember
);
router.patch(
  "/:id",
  checkPermission("member.create"),
  validate(updateMemberSchema),
  updateMember
);
router.delete("/:id", checkPermission("member.delete"), deleteMember);

export default router;
