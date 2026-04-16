# Profile Intelligence API

A backend API that analyzes a person's name using multiple external data sources and stores the result in a database. This project was built as part of the Backend Wizards Stage 1 assessment.

---

## Overview

The Profile Intelligence API accepts a name, fetches data from three public APIs, processes the results, and stores a structured profile in MongoDB.

It also provides endpoints to retrieve, filter, and delete stored profiles.

---

## External APIs Used

- Gender prediction → https://api.genderize.io  
- Age prediction → https://api.agify.io  
- Nationality prediction → https://api.nationalize.io  

---

## Features

- Calls multiple external APIs in parallel
- Classifies age into groups:
  - child (0–12)
  - teenager (13–19)
  - adult (20–59)
  - senior (60+)
- Selects the most probable country from nationality data
- Prevents duplicate profile creation (idempotency)
- Stores structured data in MongoDB
- Supports filtering by gender, country, and age group
- Handles external API failures gracefully

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Axios
- UUID v7

---

## Project Structure
```
profile-intelligence-api/
│
├── src/
│ ├── config/
│ │ └── db.js
│ ├── controllers/
│ │ └── profile.controller.js
│ ├── models/
│ │ └── profile.model.js
│ ├── routes/
│ │ └── profile.routes.js
│ ├── services/
│ │ └── externalApis.service.js
│ ├── utils/
│ │ ├── helpers.js
│ │ └── errors.js
│ └── app.js
│
├── server.js
├── .env
├── .gitignore
├── package.json
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
MONGO_URI=your_mongodb_connection_string

# 4. Start the server
npm start
```

## API Endpoints
### 1. Create Profile

POST /api/profiles

Request:
{
  "name": "ella"
}

Response:
{
  "status": "success",
  "data": { ... }
}

If profile already exists:
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ... }
}

### 2. Get Single Profile

GET /api/profiles/:id

### 3. Get All Profiles

GET /api/profiles

Optional query parameters:

gender, 
country_id, 
age_group

Example:
/api/profiles?gender=male&country_id=NG

### 4. Delete Profile

DELETE /api/profiles/:id

Returns:
204 No Content

---

## Error Handling

All errors follow this structure:
{
  "status": "error",
  "message": "Error message"
}
External API Failures
{
  "status": "error",
  "message": "Genderize returned an invalid response"
}

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
