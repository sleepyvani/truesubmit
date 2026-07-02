const API_URL = process.env.APP_BACKEND_URL;

if (!API_URL) {
  throw new Error("Please provide APP_BACKEND_URL environment variable");
}

export const APP_BACKEND_URL = API_URL;