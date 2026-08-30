import api from "./api";

export const getPendingReports = async () => {
  const response = await api.get("/api/pathologist/reports");
  return response.data;
};

export const getPathologistReports = async () => {
  const response = await api.get("/api/pathologist/reports/all");
  return response.data;
};

export const getPathologistMonthlyReport = async (month) => {
  const response = await api.get("/api/pathologist/reports/monthly", { params: { month } });
  return response.data;
};

export const getPathologistProfile = async () => {
  const response = await api.get("/api/pathologist/profile");
  return response.data;
};

export const uploadPathologistSignature = async ({ file, qualification, registrationNumber }) => {
  const formData = new FormData();
  formData.append("signature", file);
  formData.append("qualification", qualification);
  formData.append("registrationNumber", registrationNumber);
  const response = await api.post("/api/pathologist/profile/signature", formData);
  return response.data;
};

export const approveReport = async (reportId, payload) => {
  const response = await api.patch(`/api/pathologist/reports/${reportId}/approve`, payload);
  return response.data;
};

export const rejectReport = async (reportId, payload) => {
  const body = typeof payload === "string" ? { rejectionReason: payload } : payload;
  const response = await api.patch(`/api/pathologist/reports/${reportId}/reject`, body);
  return response.data;
};
