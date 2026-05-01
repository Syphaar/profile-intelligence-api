 /**
  * STAGE 3 ADDITION
  * Authentication guard utility
  * This checks if a user is authenticated BEFORE accessing protected routes
  */

export const requireAuth = (req, res, next) => {
  try {
    // In Stage 3, this will come from:
    // - JWT middleware OR
    // - GitHub OAuth session OR
    // - CLI stored token

    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized - authentication required"
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Auth middleware failure"
    });
  }
};