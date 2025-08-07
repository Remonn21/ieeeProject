import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { validate } from "../../middlewares/validate";
import {
  createForm,
  deleteForm,
  getFormDetails,
  getFormResponses,
  searchForms,
  updateForm,
} from "../../controllers/formController";
import { checkPermission } from "../../middlewares/checkPermission";

const router = Router();

router.post("/", checkPermission("form.create"), createForm);
router.get("/:id", checkPermission("form.show"), getFormDetails);
router.get("/:id/responses", checkPermission("form.submissions"), getFormResponses);
router.patch("/:id", checkPermission("form.update"), updateForm);
router.delete("/:id", checkPermission("form.delete"), deleteForm);
router.get("/", searchForms);

export default router;
