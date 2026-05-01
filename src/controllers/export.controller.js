import Profile from "../models/profile.model.js";
import { convertToCSV } from "../services/csv.service.js";
import { validateProfileQuery } from "../utils/queryValidation.js";

/**
 * EXPORT PROFILES AS CSV (Stage 3 requirement)
 */
export const exportProfilesCSV = async (req, res) => {
  try {
    const { page, limit, ...filters } = validateProfileQuery(req.query);
    const profiles = await Profile.findAllWithFilters(filters);

    const csv = convertToCSV(profiles);

    res.header("Content-Type", "text/csv");
    res.attachment("profiles.csv");

    return res.send(csv);
  } catch {
    return res.status(500).json({
      status: "error",
      message: "CSV export failed"
    });
  }
};
