import prisma from "../lib/prisma.js";

/**
 * STAGE 3: AUDIT LOGGING
 */
export const logAction = async (userId, action) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action
      }
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};