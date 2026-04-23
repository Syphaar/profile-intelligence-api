import { countryMap } from "./countryMap.js";

const COUNTRY_NAME_TO_CODE = Object.fromEntries(
  Object.entries(countryMap).map(([code, name]) => [name.toLowerCase(), code])
);

const containsWord = (text, pattern) => pattern.test(text);

const getAgeValue = (text, expressions) => {
  for (const expression of expressions) {
    const match = text.match(expression);

    if (match) {
      return Number(match[1]);
    }
  }

  return undefined;
};

export const parseQuery = (query) => {
  if (!query || typeof query !== "string") {
    return null;
  }

  const text = query.trim().toLowerCase();

  if (!text) {
    return null;
  }

  const filters = {};

  const hasMale = containsWord(text, /\bmales?\b/);
  const hasFemale = containsWord(text, /\bfemales?\b/);

  if (hasMale && !hasFemale) {
    filters.gender = "male";
  } else if (hasFemale && !hasMale) {
    filters.gender = "female";
  }

  if (containsWord(text, /\byoung\b/)) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  if (containsWord(text, /\bchildren?\b/)) {
    filters.age_group = "child";
  } else if (containsWord(text, /\bteenagers?\b/)) {
    filters.age_group = "teenager";
  } else if (containsWord(text, /\badults?\b/)) {
    filters.age_group = "adult";
  } else if (containsWord(text, /\bseniors?\b/)) {
    filters.age_group = "senior";
  }

  const minAge = getAgeValue(text, [
    /\babove (\d+)\b/,
    /\bover (\d+)\b/,
    /\bolder than (\d+)\b/,
    /\bat least (\d+)\b/
  ]);
  const maxAge = getAgeValue(text, [
    /\bbelow (\d+)\b/,
    /\bunder (\d+)\b/,
    /\byounger than (\d+)\b/,
    /\bat most (\d+)\b/
  ]);

  if (minAge !== undefined) {
    filters.min_age = minAge;
  }

  if (maxAge !== undefined) {
    filters.max_age = maxAge;
  }

  for (const [countryName, countryCode] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    const escapedCountryName = countryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escapedCountryName}\\b`);

    if (pattern.test(text)) {
      filters.country_id = countryCode;
      break;
    }
  }

  return Object.keys(filters).length > 0 ? filters : null;
};
