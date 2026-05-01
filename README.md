# Insighta Labs+ Backend

Backend API for the Stage 3 Insighta Labs+ platform. It preserves the Stage 2 Profile Intelligence System and adds GitHub OAuth with PKCE, JWT access/refresh sessions, role-based access control, versioned APIs, CSV export, HTTP-only cookie support, CSRF protection, rate limiting, and request logging.

Live API: `https://profile-intelligence-api.vercel.app/`

## System Architecture

- Node.js and Express expose a versioned REST API under `/api/v1`.
- PostgreSQL stores users, profiles, refresh tokens, and audit logs.
- Prisma is the ORM for database access and migrations/schema validation.
- GitHub OAuth authenticates users for both browser and CLI clients.
- JWT access tokens authorize requests. Refresh tokens are persisted server-side so they can be rotated and revoked.
- Browser clients use HTTP-only cookies. CLI clients use JSON tokens and store them locally in `~/.insighta/credentials.json`.

## Environment Variables

```bash
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

DATABASE_URL_DEV=postgresql://...
DATABASE_URL_PROD=postgresql://...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# Optional comma-separated admin bootstrap values
ADMIN_EMAILS=admin@example.com
ADMIN_GITHUB_IDS=123456
```

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:push
node prisma/seed.js
npm start
```

## Authentication Flow

### Browser OAuth

1. The web portal opens:

```text
GET /api/v1/auth/github/start
```

2. The backend generates a PKCE `code_verifier`, `code_challenge`, and OAuth `state`.
3. The backend stores `oauth_state` and `pkce_verifier` in HTTP-only cookies, then redirects to GitHub.
4. GitHub redirects back to:

```text
GET /api/v1/auth/github/callback?code=...&state=...
```

5. The backend validates `state`, exchanges the code using PKCE, creates or updates the user, persists the refresh token, sets `access_token` and `refresh_token` HTTP-only cookies, then redirects to the web portal dashboard.

### CLI OAuth

The CLI requests JSON instead of a browser redirect:

```text
GET /api/v1/auth/github/start?interface=cli
```

Response:

```json
{
  "status": "success",
  "authUrl": "https://github.com/login/oauth/authorize?...",
  "state": "...",
  "codeVerifier": "..."
}
```

After the user authorizes GitHub, the CLI sends the callback code and verifier:

```text
GET /api/v1/auth/github/callback?interface=cli&code=...&state=...&code_verifier=...
```

The backend returns `accessToken`, `refreshToken`, and `user`. The CLI should save those credentials at:

```text
~/.insighta/credentials.json
```

## Token Handling Approach

- Access tokens are JWTs that expire in `15m`.
- Refresh tokens are JWTs that expire in `7d`.
- Refresh tokens are stored in the database in the `RefreshToken` table.
- Login replaces older refresh tokens for that user.
- Refresh rotates the refresh token: the old token is deleted and a new one is stored.
- Logout deletes the user's stored refresh tokens and clears browser cookies.

Refresh endpoint:

```text
POST /api/v1/tokens/refresh
```

Body for CLI:

```json
{
  "refreshToken": "..."
}
```

Browser clients may use the `refresh_token` HTTP-only cookie.

## Role Enforcement Logic

Users have one of two roles:

- `admin`
- `analyst`

New users are `analyst` by default. To bootstrap admins, set `ADMIN_EMAILS` or `ADMIN_GITHUB_IDS`.

Protected endpoints require authentication and then role checks:

- `admin` and `analyst`: create, list, search, read, and export profiles
- `admin` only: delete profiles

Unauthorized requests return `401`. Authenticated users without the required role receive `403`.

## CSRF Protection

Browser clients use HTTP-only cookies, so state-changing cookie requests require a CSRF token.

Get a CSRF token:

```text
GET /api/v1/auth/csrf-token
```

Send it on state-changing requests:

```text
X-CSRF-Token: <token>
```

Bearer-token CLI requests do not require CSRF because they are not cookie-authenticated.

## API Endpoints

All profile endpoints are versioned under `/api/v1`.

### Create Profile

```text
POST /api/v1/profiles
```

Body:

```json
{
  "name": "damola"
}
```

### List Profiles

```text
GET /api/v1/profiles
```

Supported query params:

- `gender`
- `age_group`
- `country_id`
- `min_age`
- `max_age`
- `min_gender_probability`
- `min_country_probability`
- `sort_by=age|created_at|gender_probability`
- `order=asc|desc`
- `page`
- `limit`

Pagination shape:

```json
{
  "status": "success",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### Natural Language Search

```text
GET /api/v1/profiles/search?q=adult males from kenya&page=1&limit=10
```

### Get Profile

```text
GET /api/v1/profiles/:id
```

### Delete Profile

```text
DELETE /api/v1/profiles/:id
```

Requires `admin`.

### CSV Export

```text
GET /api/v1/export/csv
```

Supports the same filter/sort query params as the list endpoint and returns `profiles.csv`.

## Natural Language Parsing Approach

The parser is rule-based and lives in `src/utils/nlParser.js`. It lowercases input, extracts supported gender words, age-group words, age-range phrases, and country names from the internal country map.

Examples:

- `young males` -> `gender=male`, `min_age=16`, `max_age=24`
- `females above 30` -> `gender=female`, `min_age=30`
- `people from angola` -> `country_id=AO`
- `adult males from kenya` -> `gender=male`, `age_group=adult`, `country_id=KE`

Unsupported natural language returns:

```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

## Operational Features

- Rate limiting: `100` requests per minute per client.
- Request logging: method, timestamp, and URL are logged for each request.
- Audit logging: login and logout actions are stored in `AuditLog`.
