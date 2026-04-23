import "dotenv/config";
import fs from "fs";
import { v7 as uuidv7 } from "uuid";
import { configureDatabaseUrl } from "../src/config/env.js";

const databaseUrl = configureDatabaseUrl();
const { default: prisma } = await import("../src/lib/prisma.js");

const seed = async () => {
  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  try {
    const rawData = fs.readFileSync("./prisma/data.json", "utf-8");
    const parsed = JSON.parse(rawData);
    const profiles = parsed.profiles;

    if (!Array.isArray(profiles)) {
      throw new Error("Invalid data.json format: profiles must be an array");
    }

    console.log(
      `Seeding ${profiles.length} profiles into ${
        process.env.NODE_ENV === "production" ? "production" : "development"
      } database`
    );
    console.log(`Target database: ${databaseUrl}`);

    for (const profile of profiles) {
      const normalizedName = profile.name.toLowerCase();
      const existing = await prisma.profile.findUnique({
        where: { name: normalizedName },
        select: { id: true }
      });

      try {
        await prisma.profile.upsert({
          where: { name: normalizedName },
          update: {
            gender: profile.gender,
            gender_probability: profile.gender_probability,
            age: profile.age,
            age_group: profile.age_group,
            country_id: profile.country_id,
            country_name: profile.country_name,
            country_probability: profile.country_probability
          },
          create: {
            id: uuidv7(),
            name: normalizedName,
            gender: profile.gender,
            gender_probability: profile.gender_probability,
            age: profile.age,
            age_group: profile.age_group,
            country_id: profile.country_id,
            country_name: profile.country_name,
            country_probability: profile.country_probability,
            created_at: profile.created_at
              ? new Date(profile.created_at)
              : new Date()
          }
        });

        if (existing) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        console.error(`Failed upsert for "${normalizedName}": ${error.message}`);
      }
    }

    const successfulUpserts = createdCount + updatedCount;

    console.log("Seeding completed");
    console.log(`Successful upserts: ${successfulUpserts}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Failed: ${failedCount}`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seed();
