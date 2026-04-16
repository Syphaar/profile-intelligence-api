// Standardized error responses for external APIs

export const externalApiError = (apiName) => {
  return {
    status: "error",
    message: `${apiName} returned an invalid response`
  };
};