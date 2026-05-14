import api from "./api";

export const getReceptionistBookings = async () => {
  const response = await api.get("/api/receptionist/bookings");
  return response.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.patch(`/api/receptionist/bookings/${bookingId}/status`, { status });
  return response.data;
};

export const markPaymentPaid = async (bookingId, paymentMethod) => {
  const response = await api.patch(`/api/receptionist/bookings/${bookingId}/payment`, { paymentMethod });
  return response.data;
};
