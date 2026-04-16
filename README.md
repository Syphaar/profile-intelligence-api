# Profile Intelligence API

A backend system that aggregates data from Genderize, Agify, and Nationalize APIs to create enriched person profiles.

## Features
- **Data Persistence:** Stores profiles in MongoDB.
- **Idempotency:** Prevents duplicate name entries.
- **Filtering:** Search by gender, country, or age group.
- **Strict Error Handling:** Custom 502 responses for upstream API failures.

## Setup
1. `npm install`
2. Create a `.env` file with `PORT` and `MONGO_URI`.
3. `npm start`