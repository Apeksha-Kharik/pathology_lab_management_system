import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, LogOut, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getReceptionistBookings,
  markPaymentPaid,
  updateBookingStatus
} from "../services/receptionistService";

function ReceptionistDashboard() {
  const { logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setBookings(await getReceptionistBookings());
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const pendingBookings = useMemo(() => {
    return bookings.filter((booking) => booking.bookingStatus === "Pending Approval");
  }, [bookings]);

  const handleStatus = async (bookingId, status) => {
    try {
      const data = await updateBookingStatus(bookingId, status);
      alert(data.message);
      await loadBookings();
    } catch (error) {
      alert(error.response?.data?.message || "Status update failed");
    }
  };

  const handlePaid = async (bookingId) => {
    const paymentMethod = window.prompt("Payment method: cash, upi, or card", "cash");
    if (!paymentMethod) return;

    try {
      const data = await markPaymentPaid(bookingId, paymentMethod.toLowerCase());
      alert(data.message);
      await loadBookings();
    } catch (error) {
      alert(error.response?.data?.message || "Payment update failed");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">INDIPATH</p>
            <h1 className="text-2xl font-bold">Receptionist Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Summary label="Pending Bookings" value={pendingBookings.length} />
          <Summary label="Total Bookings" value={bookings.length} />
          <Summary label="Unpaid" value={bookings.filter((b) => b.paymentStatus === "Unpaid").length} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold">Booking Requests</h2>
          {loading ? (
            <p className="text-slate-500">Loading bookings...</p>
          ) : bookings.length ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="rounded-lg border border-slate-200 p-5">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">{booking.bookingCode}</p>
                      <h3 className="text-lg font-bold">{booking.testName}</h3>
                      <p className="text-sm text-slate-500">Patient: {booking.name}</p>
                      <p className="text-sm text-slate-500">Phone: {booking.phone}</p>
                      <p className="text-sm text-slate-500">Date: {booking.bookingDate} | Slot: {booking.timeSlot}</p>
                      {booking.notes && <p className="mt-2 text-sm text-slate-600">Notes: {booking.notes}</p>}
                    </div>
                    <div className="text-right">
                      <StatusBadge value={booking.bookingStatus} />
                      <div className="mt-2"><StatusBadge value={booking.paymentStatus} /></div>
                      <p className="mt-2 font-bold">INR {booking.amount}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {booking.bookingStatus === "Pending Approval" && (
                      <>
                        <button onClick={() => handleStatus(booking._id, "Confirmed")} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
                          <CheckCircle2 size={16} /> Confirm booking
                        </button>
                        <button onClick={() => handleStatus(booking._id, "Rejected")} className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
                          <XCircle size={16} /> Reject booking
                        </button>
                      </>
                    )}
                    {booking.bookingStatus === "Confirmed" && booking.paymentStatus === "Unpaid" && (
                      <button onClick={() => handlePaid(booking._id)} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                        <CreditCard size={16} /> Mark as Paid
                      </button>
                    )}
                    {["Confirmed", "Sample Collected", "Processing", "Completed"].includes(booking.bookingStatus) && (
                      <select
                        value={booking.bookingStatus}
                        onChange={(e) => handleStatus(booking._id, e.target.value)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Sample Collected">Sample Collected</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Report Ready">Report Ready</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-6 text-center text-slate-500">No booking requests yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-700">{value}</p>
    </div>
  );
}

function StatusBadge({ value }) {
  const classes = value === "Paid" || value === "Confirmed"
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return <span className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
}

export default ReceptionistDashboard;
