const PROFILE_FILTER_KEYS = new Set([
  "gender",
  "age_group",
  "country_id",
  "country_nam",
  "min_age",
  "max_age",
  "min_gender_probability",
  "min_country_probability",
  "sort_by",
  "order",
  "page",
  "limit"
]);

const SEARCH_KEYS = new Set(["q", "page", "limit"]);
const VALID_GENDERS = new Set(["male", "female"]);
const VALID_AGE_GROUPS = new Set(["child", "teenager", "adult", "senior"]);
const VALID_SORT_FIELDS = new Set(["age", "created_at", "gender_probability"]);
const VALID_ORDERS = new Set(["asc", "desc"]);

const buildError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseNonNegativeInteger = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(String(value))) {
    throw buildError(422, "Invalid query parameters");
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw buildError(422, "Invalid query parameters");
  }

  return parsed;
};

const parsePositiveInteger = (value) => {
  const parsed = parseNonNegativeInteger(value);

  if (parsed !== undefined && parsed < 1) {
    throw buildError(422, "Invalid query parameters");
  }

  return parsed;
};

const parseNumberInRange = (value, minimum = 0, maximum = 1) => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw buildError(422, "Invalid query parameters");
  }

  return parsed;
};

const assertAllowedKeys = (query, allowedKeys) => {
  if (Object.keys(query).some((key) => !allowedKeys.has(key))) {
    throw buildError(422, "Invalid query parameters");
  }
};

export const validateProfileQuery = (query) => {
  assertAllowedKeys(query, PROFILE_FILTER_KEYS);

  const normalized = {};

  if (query.gender !== undefined) {
    const gender = String(query.gender).trim().toLowerCase();

    if (!VALID_GENDERS.has(gender)) {
      throw buildError(422, "Invalid query parameters");
    }

    normalized.gender = gender;
  }

  if (query.age_group !== undefined) {
    const ageGroup = String(query.age_group).trim().toLowerCase();

    if (!VALID_AGE_GROUPS.has(ageGroup)) {
      throw buildError(422, "Invalid query parameters");
    }

    normalized.age_group = ageGroup;
  }

  if (query.country_id !== undefined) {
    const countryId = String(query.country_id).trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(countryId)) {
      throw buildError(422, "Invalid query parameters");
    }

    normalized.country_id = countryId;
  }

  normalized.min_age = parseNonNegativeInteger(query.min_age);
  normalized.max_age = parseNonNegativeInteger(query.max_age);

  if (
    normalized.min_age !== undefined &&
    normalized.max_age !== undefined &&
    normalized.min_age > normalized.max_age
  ) {
    throw buildError(422, "Invalid query parameters");
  }

  normalized.min_gender_probability = parseNumberInRange(query.min_gender_probability);
  normalized.min_country_probability = parseNumberInRange(query.min_country_probability);

  normalized.sort_by = query.sort_by
    ? String(query.sort_by).trim().toLowerCase()
    : "created_at";
  if (!VALID_SORT_FIELDS.has(normalized.sort_by)) {
    throw buildError(422, "Invalid query parameters");
  }

  normalized.order = query.order ? String(query.order).trim().toLowerCase() : "desc";
  if (!VALID_ORDERS.has(normalized.order)) {
    throw buildError(422, "Invalid query parameters");
  }

  normalized.page = parsePositiveInteger(query.page) ?? 1;
  normalized.limit = Math.min(parsePositiveInteger(query.limit) ?? 10, 50);

  return normalized;
};

export const validateSearchQuery = (query) => {
  assertAllowedKeys(query, SEARCH_KEYS);

  if (query.q === undefined || String(query.q).trim() === "") {
    throw buildError(400, "Missing or empty parameter");
  }

  return {
    q: String(query.q).trim(),
    page: parsePositiveInteger(query.page) ?? 1,
    limit: Math.min(parsePositiveInteger(query.limit) ?? 10, 50)
  };
};
