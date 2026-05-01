import prisma from "../lib/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "./token.service.js";

const cookieSecure = process.env.NODE_ENV === "production";

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    path: "/"
  });
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.body?.refreshToken || req.cookies?.refresh_token;

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Missing refresh token"
      });
    }

    const decoded = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!stored || stored.userId !== decoded.userId) {
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh token"
      });
    }

    const accessToken = generateAccessToken(stored.user);
    const refreshToken = generateRefreshToken(stored.user);

    await prisma.refreshToken.delete({
      where: { token }
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: stored.userId
      }
    });

    if (req.cookies?.refresh_token) {
      setRefreshCookie(res, refreshToken);
    }

    return res.status(200).json({
      status: "success",
      access_token: accessToken,
      refresh_token: refreshToken
    });
  } catch {
    return res.status(401).json({
      status: "error",
      message: "Invalid refresh token"
    });
  }
};
