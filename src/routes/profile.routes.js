import express from "express";
import {
  createProfile,
  getProfile,
  getProfiles,
  deleteProfile,
  searchProfiles 
} from "../controllers/profile.controller.js";

const router = express.Router();

router.post("/", createProfile);
router.get("/", getProfiles);
router.get("/search", searchProfiles);
router.get("/:id", getProfile);
router.delete("/:id", deleteProfile);

export default router;