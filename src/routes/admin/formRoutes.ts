import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";

import { validate } from "../../middlewares/validate";
import {
  createForm,
  getFormDetails,
  searchForms,
} from "../../controllers/formController";

const router = Router();

router.post("/", createForm);
router.get("/:id", getFormDetails);
router.get("/", searchForms);

export default router;
