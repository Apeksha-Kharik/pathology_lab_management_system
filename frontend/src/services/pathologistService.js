import api from "./api";

export const getPendingReports = async () => {
  const response = await api.get("/api/pathologist/reports");
  return response.data;
};

export const approveReport = async (reportId, pathologistSignature) => {
  const response = await api.patch(`/api/pathologist/reports/${reportId}/approve`, { pathologistSignature });
  return response.data;
};
