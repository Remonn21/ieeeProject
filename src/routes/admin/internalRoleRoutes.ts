import express from "express";
import {
  createInternalRole,
  deleteInternalRole,
  getAllInternalRoles,
  getInternalPermissions,
  getInternalRole,
  updateInternalRole,
} from "../../controllers/internalRoleController";
import { checkPermission } from "../../middlewares/checkPermission";

const router = express.Router();

router.get("/permissions", checkPermission("role.index"), getInternalPermissions);

router.get("/", checkPermission("role.index"), getAllInternalRoles);
router.get("/:id", checkPermission("role.update"), getInternalRole);
router.post("/", checkPermission("role.create"), createInternalRole);
router.patch("/:id", checkPermission("role.create"), updateInternalRole);
router.delete("/:id", checkPermission("role.delete"), deleteInternalRole);

export default router;
