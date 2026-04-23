import Profile from "../models/profile.model.js";
import { fetchExternalData } from "../services/externalApis.service.js";
import { getAgeGroup, getTopCountry, roundUpToTwoDecimalPlaces } from "../utils/helpers.js";
import { externalApiError } from "../utils/errors.js";
import { v7 as uuidv7 } from "uuid";
import { parseQuery } from "../utils/nlParser.js";
import { countryMap } from "../utils/countryMap.js";
import {
  validateProfileQuery,
  validateSearchQuery
} from "../utils/queryValidation.js";

export const createProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (name === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty parameter"
      });
    }

    if (typeof name !== "string") {
      return res.status(422).json({
        status: "error",
        message: "Invalid parameter type"
      });
    }

    const normalizedName = name.trim().toLowerCase();

    if (!normalizedName) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty parameter"
      });
    }

    const existing = await Profile.findByName(normalizedName);

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing
      });
    }

    let externalData;
    try {
      externalData = await fetchExternalData(normalizedName);
    } catch (error) {
      return res.status(502).json(externalApiError(error.apiName));
    }

    const { gender, age, nationality } = externalData;

    if (!gender?.gender || gender.count === 0) {
      return res.status(502).json(externalApiError("Genderize"));
    }

    if (age?.age === null || age?.age === undefined) {
      return res.status(502).json(externalApiError("Agify"));
    }

    const topCountry = getTopCountry(nationality.country);

    if (!topCountry) {
      return res.status(502).json(externalApiError("Nationalize"));
    }

    const profile = await Profile.create({
      id: uuidv7(),
      name: normalizedName,
      gender: gender.gender,
      gender_probability: gender.probability,
      age: age.age,
      age_group: getAgeGroup(age.age),
      country_id: topCountry.country_id,
      country_name: countryMap[topCountry.country_id] || "Unknown",
      country_probability: roundUpToTwoDecimalPlaces(topCountry.probability),
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      status: "success",
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server failure"
    });
  }
};

export const getProfiles = async (req, res) => {
  try {
    const filters = validateProfileQuery(req.query);
    const result = await Profile.findWithFilters(filters);

    return res.status(200).json({
      status: "success",
      page: result.page,
      limit: result.limit,
      total: result.total,
      data: result.data
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.statusCode ? error.message : "Server failure"
    });
  }
};

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
      message: "Server failure"
    });
  }
};

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
      message: "Server failure"
    });
  }
};

export const searchProfiles = async (req, res) => {
  try {
    const { q, page, limit } = validateSearchQuery(req.query);
    const filters = parseQuery(q);

    if (!filters) {
      return res.status(400).json({
        status: "error",
        message: "Unable to interpret query"
      });
    }

    const result = await Profile.findWithFilters({
      ...filters,
      page,
      limit
    });

    return res.status(200).json({
      status: "success",
      page: result.page,
      limit: result.limit,
      total: result.total,
      data: result.data
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.statusCode ? error.message : "Server failure"
    });
  }
};
