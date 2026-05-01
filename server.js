import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import { configureDatabaseUrl } from "./src/config/env.js";

// Ensure DB URL is set before anything else runs
configureDatabaseUrl();

const [{ default: app }, { connectDB }] = await Promise.all([
  import("./src/app.js"),
  import("./src/config/db.js")
]);

const PORT = process.env.PORT || 5000;

/**
 * START SERVER
 * - Ensures DB is connected first
 * - Prevents app from running in broken state
 */
const startServer = async () => {
  try {
    console.log("Connecting to database...");

    await connectDB();

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}/api/v1`);
    });

  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();