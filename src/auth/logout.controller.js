import prisma from "../lib/prisma.js";
import { logAction } from "../services/audit.service.js";

const cookieSecure = process.env.NODE_ENV === "production";

export const logout = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      await logAction(userId, "LOGOUT");
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
    }

    const options = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/"
    };

    res.clearCookie("access_token", options);
    res.clearCookie("refresh_token", options);

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Logout failed"
    });
  }
};
