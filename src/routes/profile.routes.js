import express from "express";
import {
  createProfile,
  deleteProfile,
  getProfile,
  getProfiles,
  searchProfiles,
  exportProfiles
} from "../controllers/profile.controller.js";
import { authorizeRole } from "../auth/auth.middleware.js";
import { requireApiVersion } from "../middleware/apiVersion.js";

const router = express.Router();

router.use(requireApiVersion);

router.post("/", authorizeRole(["admin"]), createProfile);
router.get("/", authorizeRole(["admin", "analyst"]), getProfiles);
router.get("/search", authorizeRole(["admin", "analyst"]), searchProfiles);
router.get("/export", authorizeRole(["admin", "analyst"]), exportProfiles);
router.get("/:id", authorizeRole(["admin", "analyst"]), getProfile);
router.delete("/:id", authorizeRole(["admin"]), deleteProfile);

export default router;
