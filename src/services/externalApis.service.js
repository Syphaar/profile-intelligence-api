// Handles all external API calls (Genderize, Agify, Nationalize)
import axios from "axios";

const fetchApi = async (apiName, url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    error.apiName = apiName;
    throw error;
  }
};

export const fetchExternalData = async (name) => {
  // Call all APIs in parallel for performance
  const [gender, age, nationality] = await Promise.all([
    fetchApi("Genderize", `https://api.genderize.io?name=${name}`),
    fetchApi("Agify", `https://api.agify.io?name=${name}`),
    fetchApi("Nationalize", `https://api.nationalize.io?name=${name}`)
  ]);

  return {
    gender,
    age,
    nationality
  };
};
