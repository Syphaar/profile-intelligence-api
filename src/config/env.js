export const resolveDatabaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  }

  return process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
};

export const configureDatabaseUrl = () => {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Missing PostgreSQL connection string. Set DATABASE_URL_DEV or DATABASE_URL_PROD."
    );
  }

  process.env.DATABASE_URL = databaseUrl;

  return databaseUrl;
};
