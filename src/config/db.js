import prisma from "../lib/prisma.js";

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log(
      `PostgreSQL connected in ${
        process.env.NODE_ENV === "production" ? "production" : "development"
      } mode`
    );
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};
