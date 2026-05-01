import crypto from "crypto";
import prisma from "../lib/prisma.js";
import {
  assertGitHubOAuthCredentials,
  getGitHubAccessToken,
  getGitHubOAuthCredentials,
  getGitHubUser
} from "./github.oauth.js";
import {
  findOrCreateUser,
  generateAuthSession
} from "./auth.service.js";
import { logAction } from "../services/audit.service.js";
import { generateCsrfToken } from "../middleware/csrf.middleware.js";

const cookieSecure = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const pkceStore = new Map();
const isExpired = (entry) => {
  return entry.expiresAt < Date.now();
};

const base64UrlEncode = (buffer) =>
  buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const createPkcePair = () => {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  return { codeVerifier, codeChallenge };
};

const isJsonClient = (req) =>
  req.query.interface === "cli" ||
  req.headers["user-agent"]?.includes("node") ||
  req.headers.accept?.includes("application/json");

const getAuthMode = (req) =>
  req.query.mode ||
  req.body?.mode ||
  (req.query.interface === "cli" ? "cli" : undefined);

const setSessionCookies = (res, session) => {
  const options = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    path: "/"
  };

  res.cookie("access_token", session.accessToken, options);
  res.cookie("refresh_token", session.refreshToken, options);
};

export const githubStart = (req, res) => {
  const credentials = getGitHubOAuthCredentials(getAuthMode(req));
  assertGitHubOAuthCredentials(credentials);
  const state = base64UrlEncode(crypto.randomBytes(24));
  const { codeVerifier, codeChallenge } = createPkcePair();

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    // redirect_uri: `${backendUrl}/api/v1/auth/github/callback`,
    redirect_uri: "http://localhost:5000/auth/github/callback",
    scope: "read:user user:email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });
  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  pkceStore.set(state, {
    codeVerifier,
    mode: credentials.mode,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  if (isJsonClient(req)) {
    return res.status(200).json({
      status: "success",
      authUrl,
      state,
      codeVerifier
    });
  }

  const oauthCookieOptions = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/api/v1/auth"
  };

  res.cookie("oauth_state", state, oauthCookieOptions);
  res.cookie("pkce_verifier", codeVerifier, oauthCookieOptions);
  res.cookie("oauth_mode", credentials.mode, oauthCookieOptions);

  return res.redirect(authUrl);
};

export const githubLogin = async (req, res) => {
  try {
    const { code, code_verifier: queryCodeVerifier, state } = req.query;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Missing OAuth code"
      });
    }

    const cookieState = req.cookies?.oauth_state;
    if (!state) {
      return res.status(400).json({
        status: "error",
        message: "Missing OAuth state"
      });
    }

    const realState = state;
    const stored = pkceStore.get(realState);
    const mode = getAuthMode(req) || stored?.mode || req.cookies?.oauth_mode;

    // 1. Try memory store
    let codeVerifier = stored?.codeVerifier;

    // 2. Fallback to cookies / CLI
    if (!codeVerifier) {
      codeVerifier =
        req.cookies?.pkce_verifier ||
        req.query?.code_verifier;
    }

    // 3. HARD FAIL only if truly missing
    if (!codeVerifier) {
      return res.status(400).json({
        status: "error",
        message: "Missing PKCE verifier"
      });
    }

    // 4. Expiry check ONLY if store exists
    if (stored && stored.expiresAt < Date.now()) {
      pkceStore.delete(realState);
      return res.status(400).json({
        status: "error",
        message: "PKCE session expired or invalid"
      });
    }

    // Fallback to cookies or query params (CLI/stateless)
    if (!codeVerifier) {
      codeVerifier = req.cookies?.pkce_verifier || req.query?.code_verifier;
    }

    if (!codeVerifier) {
    // fallback: CLI / stateless recovery
    const fallback = req.cookies?.pkce_verifier || req.query?.code_verifier;

    if (!fallback) {
        return res.status(400).json({
          status: "error",
          message: "Missing PKCE verifier"
        });
      }
      codeVerifier = fallback;
    }

    if (cookieState && state !== cookieState) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OAuth state"
      });
    }

    const githubToken = await getGitHubAccessToken(
      code,
      codeVerifier,
      mode
      // queryCodeVerifier || cookieCodeVerifier
    );
    const githubUser = await getGitHubUser(githubToken);
    const user = await findOrCreateUser(githubUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await logAction(user.id, "LOGIN");

    const session = await generateAuthSession(user);

    if (isJsonClient(req)) {
      return res.status(200).json({
        status: "success",
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user
      });
    }

    setSessionCookies(res, session);
    res.clearCookie("oauth_state", { path: "/api/v1/auth" });
    res.clearCookie("pkce_verifier", { path: "/api/v1/auth" });
    res.clearCookie("oauth_mode", { path: "/api/v1/auth" });

    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error("OAuth error:", error.response?.data || error.message);

    return res.status(500).json({
      status: "error",
      message: error.message || "OAuth login failed"
    });
  }
};

export const getCsrfToken = (req, res) => {
  const csrfToken = generateCsrfToken(req.user.userId);

  return res.status(200).json({
    status: "success",
    csrfToken
  });
};

export const githubTokenExchange = async (req, res) => {
  try {
    const { code, code_verifier: codeVerifier } = req.body;
    const mode = getAuthMode(req);
    console.log(mode);

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Missing OAuth code"
      });
    }

    if (!codeVerifier) {
      return res.status(400).json({
        status: "error",
        message: "Missing code_verifier"
      });
    }

    const githubToken = await getGitHubAccessToken(code, codeVerifier, mode);
    const githubUser = await getGitHubUser(githubToken);
    const user = await findOrCreateUser(githubUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await logAction(user.id, "LOGIN");

    const session = await generateAuthSession(user);

    return res.status(200).json({
      status: "success",
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user
    });
  } catch (error) {
    console.error("Token exchange error:", error.response?.data || error.message);

    return res.status(500).json({
      status: "error",
      message: error.response?.data?.error_description || error.message || "Token exchange failed"
    });
  }
};
