import api from "./api";

export const getPendingReports = async () => {
  const response = await api.get("/api/pathologist/reports");
  return response.data;
};

export const getPathologistReports = async () => {
  const response = await api.get("/api/pathologist/reports/all");
  return response.data;
};

export const approveReport = async (reportId, payload) => {
  const body = typeof payload === "string" ? { pathologistSignature: payload } : payload;
  const response = await api.patch(`/api/pathologist/reports/${reportId}/approve`, body);
  return response.data;
};

export const rejectReport = async (reportId, payload) => {
  const body = typeof payload === "string" ? { rejectionReason: payload } : payload;
  const response = await api.patch(`/api/pathologist/reports/${reportId}/reject`, body);
  return response.data;
};
