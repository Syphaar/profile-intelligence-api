import crypto from "crypto";

/**
 * SIMPLE CSRF SYSTEM (Stage 3 requirement)
 */

const csrfStore = new Map();
const CSRF_TTL_MS = 60 * 60 * 1000;

const cleanupExpiredTokens = () => {
  const now = Date.now();

  for (const [token, session] of csrfStore.entries()) {
    if (session.expiresAt <= now) {
      csrfStore.delete(token);
    }
  }
};

/**
 * Generate CSRF token for user session
 */
export const generateCsrfToken = (userId) => {
  cleanupExpiredTokens();

  const token = crypto.randomBytes(32).toString("hex");
  csrfStore.set(token, {
    userId,
    expiresAt: Date.now() + CSRF_TTL_MS
  });

  return token;
};

/**
 * Validate CSRF token on requests
 */
export const validateCsrf = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // if (authHeader?.startsWith("Bearer ")) {
  //   return next();
  // }

  const token = req.headers["x-csrf-token"];
  const session = token ? csrfStore.get(token) : null;

  if (
    !session ||
    session.expiresAt <= Date.now() ||
    String(session.userId) !== String(req.user?.userId)
    // String(session.userId) !== String(req.user?.id || req.user?.userId)
  ) {
    if (token) {
      csrfStore.delete(token);
    }

    return res.status(403).json({
      status: "error",
      message: "Invalid CSRF token"
    });
  }

  next();
};
