import csrf from "csurf";

/**
 * STAGE 3: CSRF PROTECTION (for cookie auth web portal)
 */
export const csrfProtection = csrf({
  cookie: true
});