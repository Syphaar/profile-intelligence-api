import express from "express";
import prisma from "../lib/prisma.js";

import {
  getCsrfToken,
  githubLogin,
  githubStart,
  githubTokenExchange
} from "../auth/auth.controller.js";

import { logout } from "../auth/logout.controller.js";
import { refreshToken } from "../auth/token.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { validateCsrf } from "../middleware/csrf.middleware.js";

const router = express.Router();

router.get("/github", githubStart);
router.get("/github/callback", githubLogin);
router.post("/github/token", githubTokenExchange);
router.post("/refresh", refreshToken);
router.get("/csrf-token", authenticate, getCsrfToken);
router.post("/logout", authenticate, validateCsrf, logout);

router.get("/api/user/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found"
    });
  }

  return res.status(200).json({
    status: "success",
    data: user
  });
});

export default router;