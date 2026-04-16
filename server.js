// // Starts the server and connects to DB

// import dotenv from "dotenv";
// import app from "./src/app.js";
// import { connectDB } from "./src/config/db.js";

// dotenv.config();

// // Connect MongoDB before starting server
// connectDB();

// const PORT = process.env.PORT || 5000;

// // Start Express server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


















// Starts the server and connects to DB

import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server only AFTER DB connection
const startServer = async () => {
  try {
    await connectDB(); // IMPORTANT FIX

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();