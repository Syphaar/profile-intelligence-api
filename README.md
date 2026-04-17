# Profile Intelligence API

A backend API that analyzes a person's name using multiple external data sources and stores the result in PostgreSQL through Prisma ORM. This project was built as part of the Backend Wizards Stage 1 assessment.

---

## Overview

The Profile Intelligence API accepts a name, fetches data from three public APIs, processes the results, and stores a structured profile in PostgreSQL through Prisma ORM.

It also provides endpoints to retrieve, filter, and delete stored profiles.

---

## External APIs Used

- Gender prediction -> https://api.genderize.io?name={name}
- Age prediction -> https://api.agify.io?name={name}
- Nationality prediction -> https://api.nationalize.io?name={name}

Each API requires a `name` query parameter to return results.

---

## Features

- Calls multiple external APIs in parallel
- Classifies age into groups:
  - child (0-12)
  - teenager (13-19)
  - adult (20-59)
  - senior (60+)
- Selects the most probable country from nationality data
- Prevents duplicate profile creation (idempotency)
- Stores structured data in PostgreSQL
- Supports filtering by gender, country, and age group
- Handles external API failures gracefully
- Switches database connections dynamically for development and production

---

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Axios
- UUID v7

---

## Project Structure

```text
profile-intelligence-api/
|-- src/
|   |-- config/
|   |   `-- db.js
|   |-- controllers/
|   |   `-- profile.controller.js
|   |-- models/
|   |   `-- profile.model.js
|   |-- routes/
|   |   `-- profile.routes.js
|   |-- services/
|   |   `-- externalApis.service.js
|   |-- utils/
|   |   |-- helpers.js
|   |   `-- errors.js
|   `-- app.js
|-- server.js
|-- .env
|-- .gitignore
`-- package.json
```

## Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/profile-intelligence-api.git
cd profile-intelligence-api

# 2. Install dependencies
npm install

# 3. Create a .env file
PORT=5000
NODE_ENV=development
DATABASE_URL_DEV=postgresql://postgres:password@localhost:5432/profile_intelligence_dev
DATABASE_URL_PROD=postgresql://postgres:password@localhost:5432/profile_intelligence_prod
PG_SSL=false

# 4. Start the server
npm run prisma:generate
npm run prisma:push
npm start
```

## API Endpoints

### 1. Create Profile

`POST /api/profiles`

Request:

```json
{
  "name": "ella"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "id": "uuid-v7",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 12345,
    "age": 45,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.81,
    "created_at": "2026-04-17T12:00:00.000Z"
  }
}
```

If profile already exists:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": {}
}
```

### 2. Get Single Profile

`GET /api/profiles/:id`

### 3. Get All Profiles

`GET /api/profiles`

Optional query parameters:

- `gender`
- `country_id`
- `age_group`

Example:

`/api/profiles?gender=male&country_id=NG`

### 4. Delete Profile

`DELETE /api/profiles/:id`

Returns:

`204 No Content`

---

## Error Handling

All errors follow this structure:

```json
{
  "status": "error",
  "message": "Error message"
}
```

External API failures:

```json
{
  "status": "error",
  "message": "Genderize returned an invalid response"
}
```

---

## Testing

You can test the API using:

- Postman
- Thunder Client

---

## Evaluation Focus

This project demonstrates:

- API design
- Data persistence
- External API integration
- Error handling
- Clean architecture (controllers, services, utils)

---

## Author

Built by Sifon Emmanuel
