import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle2, ClipboardList, CreditCard, Download, Eye, History, LogOut, Plus, Search, UserCheck, UserRound, XCircle } from "lucide-react";
import { useAuth } from "../context/useAuth";
import logo from "../assets/logo.png";
import {
  createWalkInBooking,
  assignTechnician,
  downloadReceptionistReceipt,
  getReceptionistBookings,
  getReceptionistTests,
  markPaymentPaid,
  updateBookingStatus
} from "../services/receptionistService";

const safeFilePart = (value) => String(value || "patient").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "patient";

const buildPatientPdfFilename = (booking) => `${safeFilePart(booking.name)}-${safeFilePart(booking.patientCode || "pending-patient-id")}-RCT.pdf`;
const receptionistFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";
const getPatientIdText = (booking) => {
  if (booking.patientCode) return booking.patientCode;
  if (booking.bookingStatus === "Pending Approval") return "Pending approval";
  if (booking.bookingStatus === "Rejected") return "Not issued";
  return "Generating ID";
};

function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [activeView, setActiveView] = useState("workflow");

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      const [bookingData, testData] = await Promise.all([
        getReceptionistBookings(searchValue),
        getReceptionistTests()
      ]);
      setBookings(bookingData || []);
      setTests(testData || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load receptionist dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData("");
  }, [loadData]);

  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.bookingStatus === "Pending Approval"), [bookings]);
  const todaysBookings = useMemo(() => bookings.filter((booking) => booking.bookingDate === today && booking.bookingStatus !== "Rejected"), [bookings, today]);
  const pendingPayments = useMemo(() => bookings.filter((booking) => ["Confirmed", "Arrived"].includes(booking.bookingStatus) && booking.paymentStatus === "Unpaid"), [bookings]);
  const paidAwaitingArrival = useMemo(() => bookings.filter((booking) => booking.bookingStatus === "Confirmed" && booking.paymentStatus === "Paid" && !booking.patientArrived), [bookings]);
  const readyForAssignment = useMemo(() => bookings.filter((booking) => (booking.patientArrived || booking.bookingStatus === "Arrived") && booking.paymentStatus === "Paid" && !booking.assignedTechnician && !["Processing", "Pending Report Approval", "Report Ready"].includes(booking.bookingStatus)), [bookings]);
  const workflowSections = [
    {
      title: "New Booking Requests",
      description: "Patient-submitted bookings waiting for receptionist confirmation or rejection.",
      bookings: pendingBookings,
      variant: "pending"
    },
    {
      title: "Today's Schedule",
      description: "All non-rejected appointments dated today, including confirmed, arrived, paid, and assigned visits.",
      bookings: todaysBookings
    },
    {
      title: "Payment Due",
      description: "Confirmed or arrived patients whose payment still needs to be collected.",
      bookings: pendingPayments
    },
    {
      title: "Paid - Awaiting Arrival",
      description: "Payment is complete, but arrival still needs to be marked before technician assignment.",
      bookings: paidAwaitingArrival
    },
    {
      title: "Ready for Technician Assignment",
      description: "Arrived, paid patients ready for automatic fair technician assignment.",
      bookings: readyForAssignment
    }
  ];

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
      link.download = buildPatientPdfFilename(booking);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt generation failed");
    }
  };

  const handleViewReceipt = async (booking) => {
    try {
      const blob = await downloadReceptionistReceipt(booking._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt preview failed");
    }
  };

  const handleAssignTechnician = async (bookingId) => {
    try {
      const data = await assignTechnician(bookingId);
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
    <div className="min-h-screen bg-[#f6fbf8] text-slate-900" style={{ fontFamily: receptionistFont }}>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 shadow-lg shadow-emerald-950/5 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[auto_minmax(320px,1fr)_auto] lg:items-center lg:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
            <div>
              <span className="block text-xl font-black leading-none tracking-tight text-emerald-950">INDIPATH</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Reception Desk</span>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2 shadow-inner shadow-emerald-950/5">
            <Search className="shrink-0 text-emerald-700" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, booking ID, or phone"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">
              Search
            </button>
          </form>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="hidden items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <UserRound size={18} />
              </span>
              <div className="max-w-36">
                <p className="truncate text-sm font-black text-emerald-950">{user?.name || "Receptionist"}</p>
                <p className="truncate text-xs font-semibold text-slate-500">{user?.email || "Front Desk"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <ReceptionDeskNav
          activeView={activeView}
          onHistory={() => setActiveView("history")}
          onWalkIn={() => setShowWalkIn(true)}
          onWorkflow={() => setActiveView("workflow")}
        />

        {loading ? (
          <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-xl shadow-emerald-950/5">Loading bookings...</div>
        ) : activeView === "history" ? (
          <PatientHistoryTable bookings={bookings} onViewReceipt={handleViewReceipt} />
        ) : (
          <div className="space-y-5">
            {workflowSections.map((section) => section.variant === "pending" ? (
              <PendingBookingsTable key={section.title} bookings={section.bookings} description={section.description} title={section.title} onStatus={handleStatus} />
            ) : (
              <BookingSection key={section.title} title={section.title} description={section.description} bookings={section.bookings} onAssignTechnician={handleAssignTechnician} onArrived={(id) => handleStatus(id, "Arrived")} onPaid={setPaymentBooking} onReceipt={handleReceipt} />
            ))}
          </div>
        )}
      </main>

      {showWalkIn && <WalkInModal tests={tests} onClose={() => setShowWalkIn(false)} onCreated={() => { setShowWalkIn(false); loadData(); }} />}
      {paymentBooking && <PaymentModal booking={paymentBooking} onClose={() => setPaymentBooking(null)} onPaid={(updatedBooking) => { setPaymentBooking(null); replaceBooking(updatedBooking); }} />}
    </div>
  );
}

function ReceptionDeskNav({ activeView, onHistory, onWalkIn, onWorkflow }) {
  return (
    <section className="mb-7 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="grid gap-3 border-b border-emerald-100 p-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={onWorkflow}
          className={`flex min-h-24 items-center gap-4 rounded-2xl px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${activeView === "workflow" ? "bg-emerald-700 text-white shadow-lg shadow-emerald-950/10" : "bg-emerald-50 text-emerald-950 hover:bg-emerald-100"}`}
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activeView === "workflow" ? "bg-white/15 text-white" : "bg-white text-emerald-700"}`}>
            <ClipboardList size={21} />
          </span>
          <span>
            <span className="block text-sm font-black">Bookings</span>
            <span className={`mt-1 block text-xs font-semibold ${activeView === "workflow" ? "text-emerald-50/85" : "text-slate-500"}`}>Reception workflow</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onHistory}
          className={`flex min-h-24 items-center gap-4 rounded-2xl px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${activeView === "history" ? "bg-emerald-700 text-white shadow-lg shadow-emerald-950/10" : "bg-emerald-50 text-emerald-950 hover:bg-emerald-100"}`}
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activeView === "history" ? "bg-white/15 text-white" : "bg-white text-emerald-700"}`}>
            <History size={21} />
          </span>
          <span>
            <span className="block text-sm font-black">Patient History</span>
            <span className={`mt-1 block text-xs font-semibold ${activeView === "history" ? "text-emerald-50/85" : "text-slate-500"}`}>Visit records</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onWalkIn}
          className="flex min-h-24 items-center gap-4 rounded-2xl bg-emerald-950 px-4 py-3 text-left text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <Plus size={21} />
          </span>
          <span>
            <span className="block text-sm font-black">Walk-In Patient</span>
            <span className="mt-1 block text-xs font-semibold text-emerald-50/85">Create confirmed visit</span>
          </span>
        </button>
      </div>
    </section>
  );
}

function PatientHistoryTable({ bookings, onViewReceipt }) {
  const [dateSort, setDateSort] = useState("desc");

  const sortedBookings = useMemo(() => {
    const direction = dateSort === "asc" ? 1 : -1;
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.bookingDate || a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.bookingDate || b.date || b.createdAt || 0).getTime();
      return (dateA - dateB) * direction;
    });
  }, [bookings, dateSort]);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-emerald-950">All Patient History</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Essential booking records for receptionist follow-up.</p>
        </div>
        <button
          type="button"
          onClick={() => setDateSort((current) => current === "desc" ? "asc" : "desc")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <ArrowUpDown size={16} /> Date {dateSort === "desc" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      {sortedBookings.length ? (
        <div className="overflow-x-auto rounded-2xl border border-emerald-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
              <tr>
                <th className="p-3">Patient ID</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Test / Package</th>
                <th className="p-3">
                  <button type="button" onClick={() => setDateSort((current) => current === "desc" ? "asc" : "desc")} className="inline-flex items-center gap-2 font-black uppercase">
                    Date <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="p-3">Time</th>
                <th className="p-3">Booking Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Payment Receipt</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => (
                <tr key={booking._id} className="border-t border-emerald-100 text-slate-600 transition-colors hover:bg-emerald-50/50">
                  <td className="p-3 font-black text-emerald-700">{getPatientIdText(booking)}</td>
                  <td className="p-3 font-bold text-slate-800">{booking.name || "-"}</td>
                  <td className="p-3">{booking.phone || "-"}</td>
                  <td className="p-3">{booking.testName || "-"}</td>
                  <td className="p-3 font-semibold">{booking.bookingDate || booking.date || "-"}</td>
                  <td className="p-3">{booking.timeSlot || "-"}</td>
                  <td className="p-3"><StatusBadge value={booking.bookingStatus || booking.status || "Pending"} /></td>
                  <td className="p-3"><StatusBadge value={booking.paymentStatus || "Unpaid"} /></td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onViewReceipt(booking)}
                      disabled={booking.paymentStatus !== "Paid"}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                  <td className="p-3 text-right font-black text-emerald-950">INR {Number(booking.amount || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="No patient history found." />
      )}
    </section>
  );
}

function PendingBookingsTable({ bookings, description, onStatus, title }) {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
      <SectionHeader count={bookings.length} description={description} title={title} />
      {bookings.length ? (
        <div className="overflow-x-auto rounded-2xl border border-emerald-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
              <tr>
                <th className="p-3">Booking ID</th>
                <th className="p-3">Patient ID</th>
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
                <tr key={booking._id} className="border-t border-emerald-100 text-slate-600 transition-colors hover:bg-emerald-50/50">
                  <td className="p-3 font-bold">{booking.bookingCode}</td>
                  <td className="p-3 font-bold text-emerald-700">{getPatientIdText(booking)}</td>
                  <td className="p-3">{booking.name}</td>
                  <td className="p-3">{booking.phone}</td>
                  <td className="p-3">{booking.testName}</td>
                  <td className="p-3">{booking.bookingDate}</td>
                  <td className="p-3">{booking.timeSlot}</td>
                  <td className="p-3"><StatusBadge value={booking.bookingStatus} /></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onStatus(booking._id, "Confirmed")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800">
                        <CheckCircle2 size={14} /> Confirm
                      </button>
                      <button onClick={() => onStatus(booking._id, "Rejected")} className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700">
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

function BookingSection({ title, description, bookings, onAssignTechnician, onArrived, onPaid, onReceipt }) {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
      <SectionHeader count={bookings.length} description={description} title={title} />
      {bookings.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{booking.bookingCode}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Patient ID: {getPatientIdText(booking)}</p>
                  <h3 className="mt-3 text-lg font-black tracking-tight text-emerald-950">{booking.testName}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Patient: {booking.name}</p>
                  <p className="text-sm font-semibold text-slate-500">Phone: {booking.phone}</p>
                  <p className="text-sm font-semibold text-slate-500">{booking.bookingDate} | {booking.timeSlot}</p>
                  {booking.assignedTechnician && <p className="text-sm font-semibold text-slate-500">Technician assigned</p>}
                </div>
                <div className="text-right">
                  <StatusBadge value={booking.bookingStatus} />
                  <div className="mt-2"><StatusBadge value={booking.paymentStatus} /></div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {booking.bookingStatus === "Confirmed" && !booking.patientArrived && (
                  <button onClick={() => onArrived(booking._id)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800">
                    <UserCheck size={14} /> Patient Arrived
                  </button>
                )}
                {["Confirmed", "Arrived"].includes(booking.bookingStatus) && booking.paymentStatus === "Unpaid" && (
                  <button onClick={() => onPaid(booking)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800">
                    <CreditCard size={14} /> Mark as Paid
                  </button>
                )}
                {(booking.patientArrived || booking.bookingStatus === "Arrived") && booking.paymentStatus === "Paid" && !["Processing", "Pending Report Approval", "Report Ready"].includes(booking.bookingStatus) && (
                  <button
                    type="button"
                    onClick={() => onAssignTechnician(booking._id)}
                    disabled={Boolean(booking.assignedTechnician)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserCheck size={14} /> Auto Assign Technician
                  </button>
                )}
                {booking.paymentStatus === "Paid" && (
                  <button onClick={() => onReceipt(booking)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-900">
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

function SectionHeader({ count, description, title }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-black tracking-tight text-emerald-950">{title}</h2>
        {description && <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{description}</p>}
      </div>
      <span className="inline-flex w-fit items-center rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-emerald-700">
        {count} item{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function WalkInModal({ tests, onClose, onCreated }) {
  const [collectionType, setCollectionType] = useState("Visit Lab");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    prescribedBy: "",
    testId: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    timeSlot: "Walk-in",
    notes: "",
    houseNo: "",
    building: "",
    street: "",
    landmark: "",
    area: "",
    city: "",
    taluka: "",
    district: "",
    state: "",
    pinCode: ""
  });

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.email || !form.age || !form.gender || !form.testId || !form.bookingDate || !form.timeSlot) {
      alert("Patient name, phone, email, age, gender, test, date and time are required");
      return;
    }

    if (collectionType === "Home Collection") {
      const requiredAddressFields = ["houseNo", "street", "area", "city", "taluka", "district", "state", "pinCode"];
      const missingAddress = requiredAddressFields.some((field) => !String(form[field] || "").trim());

      if (missingAddress) {
        alert("Please complete the home collection address.");
        return;
      }
    }

    const address = collectionType === "Home Collection"
      ? `${form.houseNo}, ${form.building ? `${form.building}, ` : ""}${form.street}, ${form.landmark ? `${form.landmark}, ` : ""}${form.area}, ${form.city}, ${form.taluka}, ${form.district}, ${form.state} - ${form.pinCode}`
      : "";

    try {
      const data = await createWalkInBooking({
        ...form,
        collectionType,
        homeSample: collectionType === "Home Collection",
        address
      });
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="number" min="0" max="130" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <Input placeholder="Prescribed by / Doctor" value={form.prescribedBy} onChange={(e) => setForm({ ...form, prescribedBy: e.target.value })} />
        <select value={form.testId} onChange={(e) => setForm({ ...form, testId: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
          <option value="">Select test</option>
          {tests.map((test) => <option key={test._id} value={test._id}>{test.testName} - INR {test.price}</option>)}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} />
          <Input placeholder="Time slot" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} />
        </div>
        <select value={collectionType} onChange={(e) => setCollectionType(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
          <option value="Visit Lab">Lab Visit</option>
          <option value="Home Collection">Home Visit</option>
        </select>
        {collectionType === "Home Collection" && (
          <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 sm:grid-cols-2">
            <Input placeholder="House / Flat No." value={form.houseNo} onChange={(e) => setForm({ ...form, houseNo: e.target.value })} />
            <Input placeholder="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            <Input placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <Input placeholder="Landmark" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
            <Input placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Taluka" value={form.taluka} onChange={(e) => setForm({ ...form, taluka: e.target.value })} />
            <Input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input placeholder="PIN Code" value={form.pinCode} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} />
          </div>
        )}
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
        <button className="w-full rounded-2xl bg-emerald-700 p-3.5 font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">Create Confirmed Booking</button>
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
        <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        <button className="w-full rounded-2xl bg-emerald-700 p-3.5 font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">Save Payment</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/35 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-100 bg-white p-5 shadow-2xl shadow-emerald-950/15 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-emerald-950">{title}</h2>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const classes = value === "Paid" || value === "Confirmed" || value === "Arrived" || value === "Technician Assigned"
    ? "bg-emerald-100 text-emerald-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] ${classes}`}>{value}</span>;
}

function Input(props) {
  return <input {...props} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />;
}

function Empty({ text }) {
  return <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center text-sm font-bold text-slate-500">{text}</p>;
}

export default ReceptionistDashboard;
