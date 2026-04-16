// This file initializes the Express application,
// sets up middleware, and registers all API routes.

import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

/**
 * CORS Configuration
 * Allows all origins so the grading system
 * (which may run from any domain) can access your API
 */
app.use(cors({
  origin: "*"
}));

/**
 * Middleware to parse incoming JSON requests
 * This is required for req.body to work in POST requests
 */
app.use(express.json());

/**
 * Base route for profile-related endpoints
 * All routes will be prefixed with /api/profiles
 * Example:
 * POST /api/profiles
 * GET  /api/profiles
 */
app.use("/api/profiles", profileRoutes);

/**
 * Health check route (optional but useful for testing)
 * This helps confirm API is running
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Profile Intelligence API is running"
  });
});

export default app;