import { verifyAccessToken } from "./token.service.js";
import prisma from "../lib/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Missing token",
      });
    }

    const decoded = verifyAccessToken(token);
    
    //  FIX: normalize user object
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true }
    });

    if (user && user.isActive === false) {
      return res.status(403).json({
        status: "error",
        message: "Account disabled",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

/**
 * ROLE-BASED ACCESS CONTROL
 */
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden",
      });
    }

    next();
  };
};
