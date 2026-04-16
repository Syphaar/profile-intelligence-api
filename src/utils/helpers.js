// Contains classification logic (age group + country selection)

// Convert age into category
export const getAgeGroup = (age) => {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
};

// Get country with highest probability
export const getTopCountry = (countries) => {
  if (!countries || countries.length === 0) return null;

  return countries.reduce((prev, current) =>
    current.probability > prev.probability ? current : prev
  );
};