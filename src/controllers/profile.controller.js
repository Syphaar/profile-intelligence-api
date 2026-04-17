import Profile from "../models/profile.model.js";
import { Prisma } from "@prisma/client";
import { fetchExternalData } from "../services/externalApis.service.js";
import {
  getAgeGroup,
  getTopCountry,
  roundUpToTwoDecimalPlaces
} from "../utils/helpers.js";
import { externalApiError } from "../utils/errors.js";
import { v7 as uuidv7 } from "uuid";

// CREATE PROFILE
export const createProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // 1. Validate input
    if (name === undefined) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing or empty name" });
    }

    if (typeof name !== "string") {
      return res.status(422).json({ status: "error", message: "Invalid type" });
    }

    const normalizedName = name.trim().toLowerCase();

    if (!normalizedName) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing or empty name" });
    }

    // 2. Idempotency Check (Duplicate)
    const existing = await Profile.findByName(normalizedName);

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing
      });
    }

    // 3. Call external APIs safely
    let data;
    try {
      data = await fetchExternalData(normalizedName);
    } catch (err) {
      return res.status(502).json(externalApiError(err.apiName));
    }

    const { gender, age, nationality } = data;

    // 4. API Validations (502 logic)
    if (!gender.gender || gender.count === 0) {
      return res.status(502).json(externalApiError("Genderize"));
    }

    if (age.age === null) {
        return res.status(502).json(externalApiError("Agify"));
    }

    const topCountry = getTopCountry(nationality.country);
    if (!topCountry) {
      return res.status(502).json(externalApiError("Nationalize"));
    }

    // 5. Create profile in DB
    const profile = await Profile.create({
      id: uuidv7(),
      name: normalizedName,
      gender: gender.gender,
      gender_probability: gender.probability,
      sample_size: gender.count,
      age: age.age,
      age_group: getAgeGroup(age.age),
      country_id: topCountry.country_id,
      country_probability: roundUpToTwoDecimalPlaces(topCountry.probability),
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      status: "success",
      data: profile
    });

  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await Profile.findByName(req.body.name.trim().toLowerCase());

      if (existing) {
        return res.status(200).json({
          status: "success",
          message: "Profile already exists",
          data: existing
        });
      }
    }

    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// GET SINGLE PROFILE
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      status: "success",
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// GET ALL PROFILES (FIXED PROJECTION FOR GRADING)
export const getProfiles = async (req, res) => {
  try {
    const { gender, country_id, age_group } = req.query;
    const filter = {};

    if (gender) filter.gender = gender.toLowerCase();
    if (country_id) filter.country_id = country_id.toUpperCase();
    if (age_group) filter.age_group = age_group.toLowerCase();

    const profiles = await Profile.findAll(filter);

    return res.json({
      status: "success",
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// DELETE PROFILE
export const deleteProfile = async (req, res) => {
  try {
    const deleted = await Profile.deleteById(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
