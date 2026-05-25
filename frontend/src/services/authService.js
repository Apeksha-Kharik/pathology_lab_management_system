import api from "./api";

export const loginUser = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};

export const loginReceptionist = async (credentials) => {
  const response = await api.post("/receptionist/login", credentials);
  return response.data;
};

export const loginTechnician = async (credentials) => {
  const response = await api.post("/technician/login", credentials);
  return response.data;
};

export const loginPathologist = async (credentials) => {
  const response = await api.post("/pathologist/login", credentials);
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await api.post("/register", payload);
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await api.post("/verify-otp", payload);
  return response.data;
};

export const forgotPassword = async (payload) => {
  const response = await api.post("/forgot-password", payload);
  return response.data;
};

export const verifyResetOtp = async (payload) => {
  const response = await api.post("/verify-reset-otp", payload);
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post("/reset-password", payload);
  return response.data;
};
