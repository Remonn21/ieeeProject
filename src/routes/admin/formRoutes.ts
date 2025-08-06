import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { validate } from "../../middlewares/validate";
import {
  createForm,
  deleteForm,
  getFormDetails,
  searchForms,
} from "../../controllers/formController";

const router = Router();

router.post("/", createForm);
router.get("/:id", getFormDetails);
router.delete("/:id", deleteForm);
router.get("/", searchForms);

export default router;
