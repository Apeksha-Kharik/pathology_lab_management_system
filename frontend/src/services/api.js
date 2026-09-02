import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = `${window.location.protocol}//${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: (configuredApiUrl || defaultApiUrl).replace(/\/$/, ""),
  // Atlas discovery can take longer on the first request. Keep this aligned
  // with the backend's database connection timeout.
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
    }

    return Promise.reject(error);
  }
);

export default api;
