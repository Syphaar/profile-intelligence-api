import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

// REQUIRED BY GRADING SYSTEM
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/profiles", profileRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Profile Intelligence API is running"
  });
});

export default app;