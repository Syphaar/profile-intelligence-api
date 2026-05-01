import express from "express";
import { refreshToken } from "../auth/token.controller.js";

const router = express.Router();

router.post("/refresh", refreshToken);

export default router;
