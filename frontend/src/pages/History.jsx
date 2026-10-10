import React, { useEffect, useState } from "react";
import { getBookings } from "../services/patientService";

function History() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load booking history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="p-6">
      <h2 className="mb-5 text-2xl font-bold">Booking History</h2>
      {loading && <p>Loading bookings...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!loading && !error && bookings.length === 0 && <p>No bookings yet.</p>}
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <article key={booking._id} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-lg font-bold">{booking.testName}</p>
            <p>Booking ID: {booking.bookingCode || booking._id}</p>
            <p>Status: {booking.bookingStatus || booking.status}</p>
            <p>Date: {booking.bookingDate || booking.date}</p>
            <p>Time: {booking.timeSlot || "Not specified"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default History;
