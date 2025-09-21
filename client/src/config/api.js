// API Configuration
// This file centralizes all API-related configuration

const getApiUrl = () => {
  // Check if we're in production
  const isProduction = import.meta.env.PROD;
  
  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Fallback to localhost for development
  if (!apiUrl && !isProduction) {
    return "http://localhost:3000";
  }
  
  // Return the configured API URL
  return apiUrl || "http://localhost:3000";
};

export const API_URL = getApiUrl();

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log("API URL:", API_URL);
}
