import api from "./api";

export const getTests = async (search = "") => {
  const response = await api.get("/tests", { params: search ? { search } : {} });
  return response.data;
};

export const getPackages = async () => {
  const response = await api.get("/packages");
  return response.data;
};

export const createBooking = async (payload) => {
  const response = await api.post("/book-test", payload);
  return response.data;
};

export const getBookings = async () => {
  const response = await api.get("/bookings");
  return response.data;
};

export const getReports = async () => {
  const response = await api.get("/reports");
  return response.data;
};

export const downloadReport = async (reportId) => {
  try {
    const response = await api.get(`/reports/${reportId}/download`, {
      responseType: "blob"
    });
    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const body = JSON.parse(await error.response.data.text());
        error.reportMessage = body.message;
      } catch {
        // The server did not return a JSON error body.
      }
    }
    throw error;
  }
};

export const downloadReceipt = async (bookingId) => {
  const response = await api.get(`/receipts/${bookingId}`, {
    responseType: "blob"
  });
  return response.data;
};
