// Handles all external API calls (Genderize, Agify, Nationalize)
import axios from "axios";

export const fetchExternalData = async (name) => {
  // Call all APIs in parallel for performance
  const [genderRes, ageRes, countryRes] = await Promise.all([
    axios.get(`https://api.genderize.io?name=${name}`),
    axios.get(`https://api.agify.io?name=${name}`),
    axios.get(`https://api.nationalize.io?name=${name}`)
  ]);

  return {
    gender: genderRes.data,
    age: ageRes.data,
    nationality: countryRes.data
  };
};