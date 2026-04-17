import "dotenv/config";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveDatabaseUrl } from "../src/config/env.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Provide Prisma CLI arguments, for example: generate or db push");
  process.exit(1);
}

const databaseUrl = resolveDatabaseUrl();

if (!databaseUrl) {
  console.error(
    "Missing PostgreSQL connection string. Set DATABASE_URL_DEV or DATABASE_URL_PROD."
  );
  process.exit(1);
}

const prismaCliPath = fileURLToPath(
  new URL(
  "../node_modules/prisma/build/index.js",
  import.meta.url
  )
);

const child = spawn(process.execPath, [prismaCliPath, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl
  }
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
