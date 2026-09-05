import axios from "axios";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
  : "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Attach the JWT to every outgoing request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("safecity_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, boot the user back to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("safecity_token");
      localStorage.removeItem("safecity_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
