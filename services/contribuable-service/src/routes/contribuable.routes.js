import express from "express";
import * as contribuableController from "../controllers/contribuable.controller.js";

const router = express.Router();

// CREATE
router.post("/", contribuableController.create);

// GET ALL
router.get("/", contribuableController.findAll);

// GET BY ID
router.get("/:id", contribuableController.findById);

// UPDATE
router.put("/:id", contribuableController.update);

// DELETE LOGIQUE
router.delete("/:id", contribuableController.deactivate);

// SEARCH
router.get("/search/:query", contribuableController.search);

export default router;