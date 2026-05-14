import api from "./api";

export const getTechnicianBookings = async () => {
  const response = await api.get("/api/technician/bookings");
  return response.data;
};

export const updateTechnicianStatus = async (bookingId, status) => {
  const response = await api.patch(`/api/technician/bookings/${bookingId}/status`, { status });
  return response.data;
};

export const submitTechnicianReport = async (bookingId, payload) => {
  const response = await api.post(`/api/technician/bookings/${bookingId}/report`, payload);
  return response.data;
};
