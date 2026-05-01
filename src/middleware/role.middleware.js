/**
 * STAGE 3: ROLE BASED ACCESS CONTROL
 */

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden"
      });
    }

    next();
  };
};