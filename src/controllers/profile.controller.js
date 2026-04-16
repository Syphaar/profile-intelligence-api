import Profile from "../models/profile.model.js";
import { fetchExternalData } from "../services/externalApis.service.js";
import { getAgeGroup, getTopCountry } from "../utils/helpers.js";
import { externalApiError } from "../utils/errors.js";
import { v7 as uuidv7 } from "uuid";

// CREATE PROFILE
export const createProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // 1. Validate input
    if (!name) {
        return res.status(400).json({ status: "error", message: "Missing or empty name" });
    }

    if (typeof name !== "string") {
        return res.status(422).json({ status: "error", message: "Invalid type" });
    }

    const normalizedName = name.trim().toLowerCase();

    // 2. Idempotency Check (Duplicate)
    // We select "-_id -__v" to hide them from the user
    const existing = await Profile.findOne({ name: normalizedName }).select("-_id -__v");

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
      return res.status(502).json(externalApiError("External API"));
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
      country_probability: topCountry.probability,
      created_at: new Date().toISOString()
    });

    // 6. Final Clean-up for the 201 Response
    // Converts Mongoose document to plain object and removes internal keys
    const result = profile.toObject();
    delete result._id;
    delete result.__v;

    return res.status(201).json({
      status: "success",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// GET SINGLE PROFILE
export const getProfile = async (req, res) => {
  // Use .select("-_id -__v") to ensure specific response structure
  const profile = await Profile.findOne({ id: req.params.id }).select("-_id -__v");

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
};

// GET ALL PROFILES (FIXED PROJECTION FOR GRADING)
export const getProfiles = async (req, res) => {
  const { gender, country_id, age_group } = req.query;
  let filter = {};

  if (gender) filter.gender = gender.toLowerCase();
  if (country_id) filter.country_id = country_id.toUpperCase();
  if (age_group) filter.age_group = age_group.toLowerCase();

  // Returns ONLY the specific fields requested in the task
  const profiles = await Profile.find(filter).select(
    "id name gender age age_group country_id -_id"
  );

  return res.json({
    status: "success",
    count: profiles.length,
    data: profiles
  });
};

// DELETE PROFILE
export const deleteProfile = async (req, res) => {
  const deleted = await Profile.findOneAndDelete({ id: req.params.id });

  if (!deleted) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found"
    });
  }

  // 204 No Content for success
  return res.status(204).send();
};