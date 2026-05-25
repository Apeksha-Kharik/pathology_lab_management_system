import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Download, LogOut, Plus, Search, UserCheck, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  createWalkInBooking,
  assignTechnician,
  downloadReceptionistReceipt,
  getReceptionistBookings,
  getReceptionistTests,
  getTechnicians,
  markPaymentPaid,
  updateBookingStatus
} from "../services/receptionistService";

function ReceptionistDashboard() {
  const { logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tests, setTests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = async (searchValue = search) => {
    try {
      setLoading(true);
      const [bookingData, testData, technicianData] = await Promise.all([
        getReceptionistBookings(searchValue),
        getReceptionistTests(),
        getTechnicians()
      ]);
      setBookings(bookingData || []);
      setTests(testData || []);
      setTechnicians(technicianData || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load receptionist dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData("");
  }, []);

  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.bookingStatus === "Pending Approval"), [bookings]);
  const todaysBookings = useMemo(() => bookings.filter((booking) => booking.bookingDate === today), [bookings, today]);
  const pendingPayments = useMemo(() => bookings.filter((booking) => ["Confirmed", "Arrived"].includes(booking.bookingStatus) && booking.paymentStatus === "Unpaid"), [bookings]);
  const assignedPatients = useMemo(() => bookings.filter((booking) => booking.bookingStatus === "Technician Assigned"), [bookings]);
  const notifications = useMemo(() => [
    pendingBookings.length ? `${pendingBookings.length} new booking request(s)` : "No new booking requests",
    pendingPayments.length ? `${pendingPayments.length} unpaid patient(s)` : "No unpaid patients",
    pendingBookings.length ? `${pendingBookings.length} pending confirmation(s)` : "No pending confirmations"
  ], [pendingBookings.length, pendingPayments.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(search);
  };

  const replaceBooking = (updatedBooking) => {
    if (!updatedBooking?._id) return;
    setBookings((current) => current.map((booking) => booking._id === updatedBooking._id ? updatedBooking : booking));
  };

  const handleStatus = async (bookingId, status) => {
    const rejectionReason = status === "Rejected"
      ? window.prompt("Reason for rejection", "Requested slot unavailable") || ""
      : "";

    try {
      const data = await updateBookingStatus(bookingId, status, rejectionReason);
      alert(data.message);
      replaceBooking(data.booking);
    } catch (error) {
      alert(error.response?.data?.message || "Status update failed");
    }
  };

  const handleReceipt = async (booking) => {
    try {
      const blob = await downloadReceptionistReceipt(booking._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${booking.bookingCode || booking._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt generation failed");
    }
  };

  const handleAssignTechnician = async (bookingId, technicianId) => {
    if (!technicianId) return;

    try {
      const data = await assignTechnician(bookingId, technicianId);
      alert(data.message);
      replaceBooking(data.booking);
    } catch (error) {
      alert(error.response?.data?.message || "Technician assignment failed");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">INDIPATH</p>
            <h1 className="text-2xl font-bold">Receptionist Dashboard</h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button onClick={() => setShowWalkIn(true)} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
              <Plus size={18} /> Add Walk-In Patient
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Summary label="Total Pending Bookings" value={pendingBookings.length} />
          <Summary label="Today's Patients" value={todaysBookings.length} />
          <Summary label="Pending Payments" value={pendingPayments.length} />
          <Summary label="Assigned to Technician" value={assignedPatients.length} />
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">Notifications</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {notifications.map((notification) => (
              <div key={notification} className="rounded-md bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                {notification}
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
          <Search className="hidden text-slate-400 sm:mt-3 sm:block" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID, patient name, or phone number"
            className="w-full rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500"
          />
          <button className="rounded-md bg-blue-600 px-5 py-3 font-bold text-white">Search</button>
        </form>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">Loading bookings...</div>
        ) : (
          <div className="space-y-6">
            <PendingBookingsTable bookings={pendingBookings} onStatus={handleStatus} />
            <BookingSection title="Today's Bookings" bookings={todaysBookings} technicians={technicians} onAssignTechnician={handleAssignTechnician} onArrived={(id) => handleStatus(id, "Arrived")} onPaid={setPaymentBooking} onReceipt={handleReceipt} />
            <BookingSection title="Pending Payments" bookings={pendingPayments} technicians={technicians} onAssignTechnician={handleAssignTechnician} onArrived={(id) => handleStatus(id, "Arrived")} onPaid={setPaymentBooking} onReceipt={handleReceipt} />
            <BookingSection title="Assigned to Technician" bookings={assignedPatients} technicians={technicians} onAssignTechnician={handleAssignTechnician} onArrived={(id) => handleStatus(id, "Arrived")} onPaid={setPaymentBooking} onReceipt={handleReceipt} />
          </div>
        )}
      </main>

      {showWalkIn && <WalkInModal tests={tests} onClose={() => setShowWalkIn(false)} onCreated={() => { setShowWalkIn(false); loadData(); }} />}
      {paymentBooking && <PaymentModal booking={paymentBooking} onClose={() => setPaymentBooking(null)} onPaid={(updatedBooking) => { setPaymentBooking(null); replaceBooking(updatedBooking); }} />}
    </div>
  );
}

function PendingBookingsTable({ bookings, onStatus }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-bold">Pending Bookings</h2>
      {bookings.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Booking ID</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Test Name</th>
                <th className="p-3">Date</th>
                <th className="p-3">Time Slot</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-t border-slate-100">
                  <td className="p-3 font-bold">{booking.bookingCode}</td>
                  <td className="p-3">{booking.name}</td>
                  <td className="p-3">{booking.phone}</td>
                  <td className="p-3">{booking.testName}</td>
                  <td className="p-3">{booking.bookingDate}</td>
                  <td className="p-3">{booking.timeSlot}</td>
                  <td className="p-3"><StatusBadge value={booking.bookingStatus} /></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onStatus(booking._id, "Confirmed")} className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700">
                        <CheckCircle2 size={14} /> Confirm
                      </button>
                      <button onClick={() => onStatus(booking._id, "Rejected")} className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="No pending booking requests." />
      )}
    </section>
  );
}

function BookingSection({ title, bookings, technicians, onAssignTechnician, onArrived, onPaid, onReceipt }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-bold">{title}</h2>
      {bookings.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-md border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">{booking.bookingCode}</p>
                  <h3 className="font-bold">{booking.testName}</h3>
                  <p className="text-sm text-slate-500">Patient: {booking.name}</p>
                  <p className="text-sm text-slate-500">Phone: {booking.phone}</p>
                  <p className="text-sm text-slate-500">{booking.bookingDate} | {booking.timeSlot}</p>
                  <p className="text-sm text-slate-500">Sample: {booking.sampleStatus || "Not Collected"}</p>
                  {booking.assignedTechnician && <p className="text-sm text-slate-500">Technician assigned</p>}
                </div>
                <div className="text-right">
                  <StatusBadge value={booking.bookingStatus} />
                  <div className="mt-2"><StatusBadge value={booking.paymentStatus} /></div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {booking.bookingStatus === "Confirmed" && !booking.patientArrived && (
                  <button onClick={() => onArrived(booking._id)} className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                    <UserCheck size={14} /> Patient Arrived
                  </button>
                )}
                {["Confirmed", "Arrived"].includes(booking.bookingStatus) && booking.paymentStatus === "Unpaid" && (
                  <button onClick={() => onPaid(booking)} className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                    <CreditCard size={14} /> Mark as Paid
                  </button>
                )}
                {(booking.patientArrived || booking.bookingStatus === "Arrived") && booking.paymentStatus === "Paid" && !["Processing", "Pending Report Approval", "Report Ready"].includes(booking.bookingStatus) && (
                  <select
                    value={booking.assignedTechnician || ""}
                    onChange={(e) => onAssignTechnician(booking._id, e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold"
                  >
                    <option value="">Choose technician</option>
                    {technicians.map((technician) => (
                      <option key={technician._id} value={technician._id}>{technician.name}</option>
                    ))}
                  </select>
                )}
                {booking.paymentStatus === "Paid" && (
                  <button onClick={() => onReceipt(booking)} className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    <Download size={14} /> Generate Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty text={`No ${title.toLowerCase()}.`} />
      )}
    </section>
  );
}

function WalkInModal({ tests, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    testId: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    timeSlot: "Walk-in",
    notes: ""
  });

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.testId || !form.bookingDate) {
      alert("Patient name, phone, test and date are required");
      return;
    }

    try {
      const data = await createWalkInBooking(form);
      alert(data.message);
      onCreated();
    } catch (error) {
      alert(error.response?.data?.message || "Walk-in booking failed");
    }
  };

  return (
    <Modal title="Add Walk-In Patient" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Patient name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.testId} onChange={(e) => setForm({ ...form, testId: e.target.value })} className="w-full rounded-md border border-slate-200 p-3">
          <option value="">Select test</option>
          {tests.map((test) => <option key={test._id} value={test._id}>{test.testName} - INR {test.price}</option>)}
        </select>
        <Input type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} />
        <Input placeholder="Time slot" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-md border border-slate-200 p-3" />
        <button className="w-full rounded-md bg-green-600 p-3 font-bold text-white">Create Confirmed Booking</button>
      </form>
    </Modal>
  );
}

function PaymentModal({ booking, onClose, onPaid }) {
  const [form, setForm] = useState({
    amount: booking.amount || "",
    paymentMethod: "cash"
  });

  const submit = async (e) => {
    e.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      const data = await markPaymentPaid(booking._id, {
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod
      });
      alert(data.message);
      onPaid(data.booking);
    } catch (error) {
      alert(error.response?.data?.message || "Payment update failed");
    }
  };

  return (
    <Modal title={`Mark Payment Paid - ${booking.bookingCode}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-md border border-slate-200 p-3">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        <button className="w-full rounded-md bg-blue-600 p-3 font-bold text-white">Save Payment</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button>
        </div>
        {children}
      </div>
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
  const classes = value === "Paid" || value === "Confirmed" || value === "Arrived" || value === "Technician Assigned"
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return <span className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
}

function Input(props) {
  return <input {...props} className="w-full rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500" />;
}

function Empty({ text }) {
  return <p className="rounded-md bg-slate-50 p-6 text-center text-slate-500">{text}</p>;
}

export default ReceptionistDashboard;
