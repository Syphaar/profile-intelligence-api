// // MongoDB connection setup
// import mongoose from "mongoose";

// export const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB connected");
//   } catch (error) {
//     console.error("Database connection failed:", error.message);
//     process.exit(1);
//   }
// };






























// MongoDB connection setup (Vercel-safe version)

import mongoose from "mongoose";

let isConnected = false;

// This prevents multiple connections in serverless environment
export const connectDB = async () => {
  if (isConnected) return;

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });

    isConnected = connection.connections[0].readyState;

    console.log("MongoDB connected");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};