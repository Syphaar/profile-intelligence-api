import express from "express";
import { exportProfilesCSV } from "../controllers/export.controller.js";
import { authorizeRole } from "../auth/auth.middleware.js";

const router = express.Router();

/**
 * CSV EXPORT ENDPOINT
 */
router.get("/csv", authorizeRole(["admin", "analyst"]), exportProfilesCSV);

export default router;
