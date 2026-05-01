import axios from "axios";

const backendUrl =
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || 5000}`;

export const normalizeGitHubAuthMode = (mode) => {
  return String(mode || "").toLowerCase() === "cli" ? "cli" : "web";
};

export const getGitHubOAuthCredentials = (mode) => {
  const authMode = normalizeGitHubAuthMode(mode);

  if (authMode === "cli") {
    return {
      mode: authMode,
      clientId: process.env.GITHUB_CLIENT_ID_CLI,
      clientSecret: process.env.GITHUB_CLIENT_SECRET_CLI
    };
  }

  return {
    mode: authMode,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  };
};

export const assertGitHubOAuthCredentials = (credentials) => {
  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error(`Missing GitHub OAuth credentials for ${credentials.mode} mode`);
  }
};

/**
 * STEP 1: Exchange GitHub code for access token
 * (Server-side OAuth flow for Stage 3)
 */
export const getGitHubAccessToken = async (code, codeVerifier, mode) => {
  try {
    const credentials = getGitHubOAuthCredentials(mode);
    assertGitHubOAuthCredentials(credentials);

    console.log(`id and secret for ${credentials.mode} mode:`, credentials.clientId, credentials.clientSecret ? "****" : "MISSING");

    const params = new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      code_verifier: codeVerifier,
    });

    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      params,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.data.access_token) {
      console.log("GitHub response:", response.data);
      throw new Error(
        response.data.error_description ||
        response.data.error ||
        "No access token returned"
      );
    }

    return response.data.access_token;
  } catch (error) {
    console.error("GitHub token error:", error.response?.data || error.message);

    throw new Error(
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      "Failed to get GitHub access token"
    );
  }
};

/**
 * STEP 2: Fetch GitHub user profile
 */
export const getGitHubUser = async (accessToken) => {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    let email = response.data.email;

    console.log("GitHub user response:", response.data);

    // fallback if email is not public
    if (!email) {
      try {
        const emailResponse = await axios.get(
          "https://api.github.com/user/emails",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github+json",
            },
          }
        );

        const primaryEmail = emailResponse.data.find(
          (email) => email.primary && email.verified
        );

        email = primaryEmail?.email;
      } catch {
        email = null;
      }
    }

    return {
      ...response.data,
      email: email || null,
      name: response.data.name || response.data.login, // FIX
    };
  } catch (error) {
    console.error(
      "GitHub user error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch GitHub user");
  }
};
