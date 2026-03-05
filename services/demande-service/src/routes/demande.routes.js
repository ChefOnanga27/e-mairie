import express from "express";
import * as controller from "../controllers/demande.controller.js";

const router = express.Router();

router.post("/", controller.create);
router.get("/", controller.findAll);
router.get("/:id", controller.findById);

router.patch("/:id/assign", controller.assignAgent);
router.patch("/:id/approve", controller.approve);
router.patch("/:id/reject", controller.reject);
router.patch("/:id/deliver", controller.deliver);

export default router;