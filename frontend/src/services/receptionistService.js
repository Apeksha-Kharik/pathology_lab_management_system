import api from "./api";

export const getReceptionistBookings = async (search = "") => {
  const response = await api.get("/api/receptionist/bookings", { params: search ? { search } : {} });
  return response.data;
};

export const getReceptionistTests = async () => {
  const response = await api.get("/api/receptionist/tests");
  return response.data;
};

export const getTechnicians = async () => {
  const response = await api.get("/api/receptionist/technicians");
  return response.data;
};

export const createWalkInBooking = async (payload) => {
  const response = await api.post("/api/receptionist/walk-in-bookings", payload);
  return response.data;
};

export const updateBookingStatus = async (bookingId, status, rejectionReason = "") => {
  const response = await api.patch(`/api/receptionist/bookings/${bookingId}/status`, { status, rejectionReason });
  return response.data;
};

export const assignTechnician = async (bookingId, technicianId) => {
  const response = await api.patch(`/api/receptionist/bookings/${bookingId}/technician`, { technicianId });
  return response.data;
};

export const markPaymentPaid = async (bookingId, payload) => {
  const response = await api.patch(`/api/receptionist/bookings/${bookingId}/payment`, payload);
  return response.data;
};

export const downloadReceptionistReceipt = async (bookingId) => {
  const response = await api.get(`/api/receptionist/bookings/${bookingId}/receipt`, {
    responseType: "blob"
  });
  return response.data;
};
