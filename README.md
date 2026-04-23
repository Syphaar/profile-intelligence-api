# Profile Intelligence API

Backend API for Insighta Labs' Stage 2 Intelligence Query Engine assessment. It stores demographic profiles in PostgreSQL with Prisma, supports combined filtering, sorting, pagination, and includes a rule-based natural language search endpoint.

Live API: `https://profile-intelligence-api.vercel.app/`

## Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- UUID v7

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:push
node prisma/seed.js
npm start
```

Environment variables:

```bash
PORT=5000
NODE_ENV=development
DATABASE_URL_DEV=postgresql://...
DATABASE_URL_PROD=postgresql://...
```

## Seed Data

The seed script reads [prisma/data.json](./prisma/data.json), inserts all 2026 profiles, and uses `upsert` on the unique `name` field so rerunning the script does not create duplicates.

## Endpoints

### `POST /api/profiles`

Creates a profile from external demographic APIs.

### `GET /api/profiles`

Supports:

- filters: `gender`, `age_group`, `country_id`, `min_age`, `max_age`, `min_gender_probability`, `min_country_probability`
- sorting: `sort_by=age|created_at|gender_probability`, `order=asc|desc`
- pagination: `page` default `1`, `limit` default `10`, max `50`

Example:

```text
/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

### `GET /api/profiles/search`

Accepts plain English through `q` and converts it into filters using a rule-based parser.

Example:

```text
/api/profiles/search?q=adult males from kenya&page=1&limit=10
```

### `GET /api/profiles/:id`

Returns a single profile.

### `DELETE /api/profiles/:id`

Deletes a single profile.

## Natural Language Parsing Approach

This project uses rule-based parsing only. No AI, LLM, embeddings, or external NLP service is used.

The parser:

1. lowercases the input query
2. checks for supported gender keywords
3. checks for age-group keywords
4. checks for age-range phrases using regex
5. checks country names and maps them to ISO country codes
6. returns a filter object only if at least one supported rule matched

### Supported keywords and mappings

Gender:

- `male`, `males` -> `gender=male`
- `female`, `females` -> `gender=female`
- when both appear, gender is left unset

Age groups:

- `child`, `children` -> `age_group=child`
- `teenager`, `teenagers` -> `age_group=teenager`
- `adult`, `adults` -> `age_group=adult`
- `senior`, `seniors` -> `age_group=senior`
- `young` -> `min_age=16`, `max_age=24`

Numeric age phrases:

- `above N`
- `over N`
- `older than N`
- `at least N`
- `below N`
- `under N`
- `younger than N`
- `at most N`

Countries:

- country names are matched from the internal country map and converted to `country_id`
- example: `nigeria -> NG`, `angola -> AO`, `kenya -> KE`

### Example interpretations

- `young males` -> `gender=male`, `min_age=16`, `max_age=24`
- `females above 30` -> `gender=female`, `min_age=30`
- `people from angola` -> `country_id=AO`
- `adult males from kenya` -> `gender=male`, `age_group=adult`, `country_id=KE`
- `male and female teenagers above 17` -> `age_group=teenager`, `min_age=17`

If nothing supported can be extracted, the API returns:

```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

## Validation

`GET /api/profiles` validates:

- allowed query keys only
- `gender` values
- `age_group` values
- ISO 2-letter `country_id`
- numeric age filters
- probability filters between `0` and `1`
- allowed `sort_by`
- allowed `order`
- positive integer `page` and `limit`
- `min_age <= max_age`

Invalid list query params return:

```json
{
  "status": "error",
  "message": "Invalid query parameters"
}
```

`GET /api/profiles/search` validates:

- required non-empty `q`
- positive integer `page`
- positive integer `limit`
- no unsupported query keys

## Error Format

All errors use:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

Status usage:

- `400` -> missing or empty parameter, or uninterpretable natural language query
- `422` -> invalid parameter type or invalid query parameters
- `404` -> profile not found
- `500` / `502` -> server or upstream failure

## CORS and Timestamps

- `Access-Control-Allow-Origin: *` is enabled with `cors`
- timestamps are returned in UTC ISO 8601 format

## Performance Notes

- Prisma queries apply filters directly in SQL
- sorting and pagination are pushed to the database
- indexes were added for the main filter and sort columns
- list and search endpoints use `findMany` plus `count` with the same `where` clause instead of loading full tables into memory

## Limitations

- The natural language parser only supports the explicit keywords and regex patterns described above.
- It does not handle typos, misspellings, or broad synonyms outside the supported list.
- It does not parse sorting instructions from plain English.
- It extracts only one country per query.
- It does not understand advanced boolean logic beyond the simple supported patterns.
