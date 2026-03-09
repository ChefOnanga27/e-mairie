import express from "express";

import * as controller from "../controllers/mairie.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();


// PUBLIC
router.get("/", controller.findAll);
router.get("/:id", controller.findById);


// ADMIN ONLY
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN_MAIRIE"),
  controller.create
);

router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN_MAIRIE"),
  controller.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  controller.deactivate
);

export default router;