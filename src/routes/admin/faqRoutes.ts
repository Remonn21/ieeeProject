import { Router } from "express";

import { authorizeRoles } from "../../middlewares/authroizeRoles";
import {
  createFaq,
  deleteFaq,
  getFaqs,
  updateFaq,
} from "../../controllers/faqController";
import { validate } from "../../middlewares/validate";
import { updateFaqSchema, createFaqSchema } from "../../validations/faqValidation";

const router = Router();

router.use(authorizeRoles("EXCOM", "MEDIA"));
router.post("/", validate(createFaqSchema), createFaq);
router.patch("/:id", validate(updateFaqSchema), updateFaq);
router.get("/", getFaqs);
router.delete("/:id", deleteFaq);

export default router;
