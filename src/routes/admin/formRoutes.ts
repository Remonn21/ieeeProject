import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { validate } from "../../middlewares/validate";
import {
  createForm,
  deleteForm,
  getFormDetails,
  searchForms,
  updateForm,
} from "../../controllers/formController";

const router = Router();

router.post("/", createForm);
router.get("/:id", getFormDetails);
router.patch("/:id", updateForm);
router.delete("/:id", deleteForm);
router.get("/", searchForms);

export default router;
