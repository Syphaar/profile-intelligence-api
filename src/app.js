import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./lib/prisma.js";

import { authenticate, authorizeRole } from "./auth/auth.middleware.js";
import { validateCsrf } from "./middleware/csrf.middleware.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const csrfForStateChangingRequests = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return validateCsrf(req, res, next);
  }

  return next();
};

app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const responseTimeMs = Number(end - start) / 1_000_000;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${responseTimeMs.toFixed(1)}ms`
    );
  });

  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Profile Intelligence API is running",
    version: "v1"
  });
});

app.get("/api/user/me", authenticate, async (req, res) => {
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
    data: {
      id: user.id,
      username: user.name || user.email,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar,
      created_at: user.createdAt,
      last_login_at: user.lastLoginAt
    }
  });
});

app.use("/auth", authLimiter, authRoutes);

app.use(
  "/api/profiles",
  apiLimiter,
  authenticate,
  csrfForStateChangingRequests,
  profileRoutes
);

export default app;
