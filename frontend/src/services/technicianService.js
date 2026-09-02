import api from "./api";

export const getTechnicianBookings = async () => {
  const response = await api.get("/api/technician/bookings");
  return response.data;
};

export const getAssignmentRequests = async () => {
  const response = await api.get("/api/technician/assignment-requests");
  return response.data;
};

export const acceptAssignmentRequest = async (assignmentId) => {
  const response = await api.patch(`/api/technician/assignment-requests/${assignmentId}/accept`);
  return response.data;
};

export const rejectAssignmentRequest = async (assignmentId, rejectionReason = "") => {
  const response = await api.patch(`/api/technician/assignment-requests/${assignmentId}/reject`, { rejectionReason });
  return response.data;
};

export const updateTechnicianStatus = async (bookingId, status) => {
  const response = await api.patch(`/api/technician/bookings/${bookingId}/status`, { status });
  return response.data;
};

export const startTechnicianTest = async (bookingId) => {
  const response = await api.patch(`/api/technician/bookings/${bookingId}/start`);
  return response.data;
};

export const startTechnicianReportEntry = async (bookingId) => {
  const response = await api.post(`/api/technician/bookings/${bookingId}/report/start`);
  return response.data;
};

export const saveTechnicianReportDraft = async (bookingId, payload) => {
  const response = await api.post(`/api/technician/bookings/${bookingId}/report/draft`, payload);
  return response.data;
};

export const submitTechnicianReport = async (bookingId, payload) => {
  const response = await api.post(`/api/technician/bookings/${bookingId}/report`, payload);
  return response.data;
};
