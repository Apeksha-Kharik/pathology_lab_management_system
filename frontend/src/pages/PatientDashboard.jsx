import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, LogOut, Search, TestTube2, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  createBooking,
  downloadReport,
  downloadReceipt,
  getBookings,
  getReports,
  getTests
} from "../services/patientService";
import { changePassword, updateProfile } from "../services/profileService";

function PatientDashboard() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("tests");
  const [tests, setTests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [testsData, bookingsData, reportsData] = await Promise.all([
        getTests(),
        getBookings(),
        getReports()
      ]);
      setTests(testsData || []);
      setBookings(bookingsData || []);
      setReports(reportsData || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load patient dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredTests = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return tests.filter((test) => {
      return (
        test.testName?.toLowerCase().includes(search) ||
        test.category?.toLowerCase().includes(search)
      );
    });
  }, [tests, searchTerm]);

  const notifications = useMemo(() => {
    const pendingBookings = bookings.filter((booking) => booking.bookingStatus === "Pending Approval").length;
    const unpaidBookings = bookings.filter((booking) => booking.paymentStatus === "Unpaid").length;
    const latestReport = reports[0];

    return [
      pendingBookings ? `${pendingBookings} booking pending approval` : "No pending booking requests",
      unpaidBookings ? `${unpaidBookings} payment pending` : "No pending payments",
      latestReport ? `Latest report available: ${latestReport.testName || "Lab report"}` : "No reports uploaded yet"
    ];
  }, [bookings, reports]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const handleBooked = async () => {
    setSelectedTest(null);
    setActive("history");
    await loadDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">INDIPATH Patient Portal</p>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name || "Patient"}</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard label="Available Tests" value={tests.length} />
          <SummaryCard label="Bookings" value={bookings.length} />
          <SummaryCard label="Reports" value={reports.length} />
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-slate-800">Notifications</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {notifications.map((item) => (
              <div key={item} className="rounded-md bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
                {item}
              </div>
            ))}
          </div>
        </section>

        <nav className="mb-6 flex flex-wrap gap-2">
          <TabButton active={active === "tests"} onClick={() => { setActive("tests"); setSelectedTest(null); }}>Available Tests</TabButton>
          <TabButton active={active === "history"} onClick={() => setActive("history")}>Booking History</TabButton>
          <TabButton active={active === "payments"} onClick={() => setActive("payments")}>Payment Status</TabButton>
          <TabButton active={active === "reports"} onClick={() => setActive("reports")}>Reports & Receipts</TabButton>
          <TabButton active={active === "profile"} onClick={() => setActive("profile")}>Profile</TabButton>
        </nav>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">Loading dashboard...</div>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            {active === "tests" && (
              selectedTest ? (
                <BookingForm test={selectedTest} onCancel={() => setSelectedTest(null)} onBooked={handleBooked} />
              ) : (
                <AvailableTests tests={filteredTests} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onBook={setSelectedTest} />
              )
            )}

            {active === "history" && <BookingHistory bookings={bookings} />}
            {active === "payments" && <PaymentStatus bookings={bookings} />}
            {active === "reports" && <ReportsAndReceipts bookings={bookings} reports={reports} />}
            {active === "profile" && <ProfileSection user={user} />}
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-700">{value}</p>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-bold ${active ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

function AvailableTests({ tests, searchTerm, setSearchTerm, onBook }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3">
        <Search size={18} className="text-slate-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tests by name or category"
          className="w-full outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tests.length ? tests.map((test) => (
          <div key={test._id} className="rounded-lg border border-slate-200 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <TestTube2 className="mt-1 text-blue-600" size={24} />
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-500">{test.category}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{test.testName}</h3>
            <p className="mt-2 min-h-12 text-sm text-slate-500">{test.description || "Diagnostic lab test with verified reporting."}</p>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xl font-black text-slate-900">INR {test.price}</span>
              <button onClick={() => onBook(test)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Book
              </button>
            </div>
          </div>
        )) : (
          <p className="col-span-full py-8 text-center text-slate-500">No tests found.</p>
        )}
      </div>
    </div>
  );
}

function BookingForm({ test, onCancel, onBooked }) {
  const [form, setForm] = useState({
    bookingDate: "",
    timeSlot: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.bookingDate || !form.timeSlot) {
      alert("Please select preferred date and time slot");
      return;
    }

    try {
      const data = await createBooking({ ...form, testId: test._id });
      alert(data.message);
      onBooked();
    } catch (error) {
      alert(error.response?.data?.message || "Booking failed");
    }
  };

  return (
    <div>
      <button onClick={onCancel} className="mb-5 text-sm font-bold text-blue-600 hover:underline">Back to tests</button>
      <div className="mb-5 rounded-md bg-blue-50 p-4">
        <p className="text-xs font-bold uppercase text-blue-500">Selected Test</p>
        <h2 className="text-xl font-bold text-blue-950">{test.testName}</h2>
        <p className="text-sm text-blue-800">Amount: INR {test.price}</p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input name="selectedTest" value={test.testName} readOnly className="bg-slate-50" />
        <Input name="bookingDate" type="date" value={form.bookingDate} onChange={handleChange} />
        <select
          name="timeSlot"
          value={form.timeSlot}
          onChange={handleChange}
          className="rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500 md:col-span-2"
        >
          <option value="">Preferred time slot</option>
          <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
          <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
          <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
          <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
        </select>
        <textarea
          name="notes"
          placeholder="Additional notes"
          value={form.notes}
          onChange={handleChange}
          className="min-h-28 rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500 md:col-span-2"
        />
        <button className="rounded-md bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 md:col-span-2">Submit Booking Request</button>
      </form>
    </div>
  );
}

function BookingHistory({ bookings }) {
  if (!bookings.length) return <EmptyState text="No booking history yet." />;

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingRow key={booking._id} booking={booking} />
      ))}
    </div>
  );
}

function PaymentStatus({ bookings }) {
  if (!bookings.length) return <EmptyState text="No payments to show yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Test</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Payment</th>
            <th className="p-3">Booking</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-slate-100">
              <td className="p-3 font-semibold">{booking.testName}</td>
              <td className="p-3">INR {booking.amount}</td>
              <td className="p-3"><StatusBadge value={booking.paymentStatus} /></td>
              <td className="p-3"><StatusBadge value={booking.bookingStatus || booking.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsAndReceipts({ bookings, reports }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><FileText size={20} /> Download Report</h2>
        {reports.length ? reports.map((report) => (
          <ReportButton key={report._id} report={report} />
        )) : <EmptyState text="Download Report appears only when report status is ready." />}
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><Download size={20} /> Download Receipt</h2>
        {bookings.length ? bookings.map((booking) => (
          <ReceiptButton key={booking._id} booking={booking} />
        )) : <EmptyState text="No receipts available yet." />}
      </div>
    </div>
  );
}

function ReportButton({ report }) {
  const handleDownload = async () => {
    try {
      const blob = await downloadReport(report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${report._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Report download failed");
    }
  };

  return (
    <button onClick={handleDownload} className="mb-3 flex w-full items-center justify-between rounded-md border border-slate-200 p-4 text-left text-sm font-semibold text-blue-700">
      {report.testName || "Lab report"} <Download size={16} />
    </button>
  );
}

function ProfileSection({ user }) {
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || ""
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: ""
  });

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const data = await updateProfile(profile);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Profile update failed");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();

    try {
      const data = await changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Password change failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-lg border border-slate-200 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><User size={20} /> Patient Profile</h2>
        <p className="mb-4 text-sm text-slate-500">Email: {user?.email}</p>
        <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="mb-3 w-full" />
        <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" className="mb-3 w-full" />
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">Update Profile</button>
      </form>

      <form onSubmit={savePassword} className="rounded-lg border border-slate-200 p-5">
        <h2 className="mb-4 text-lg font-bold">Change Password</h2>
        <Input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} placeholder="Current password" className="mb-3 w-full" />
        <Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="New password" className="mb-3 w-full" />
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white">Change Password</button>
      </form>
    </div>
  );
}

function ReceiptButton({ booking }) {
  const handleDownload = async () => {
    try {
      const blob = await downloadReceipt(booking._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${booking.bookingCode || booking._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt download failed");
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={booking.paymentStatus !== "Paid"}
      className="mb-3 flex w-full items-center justify-between rounded-md border border-slate-200 p-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {booking.testName} {booking.paymentStatus === "Paid" ? <Download size={16} /> : <span className="text-xs">Unpaid</span>}
    </button>
  );
}

function BookingRow({ booking }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">{booking.bookingCode}</p>
          <p className="font-bold text-slate-900">{booking.testName}</p>
          <p className="text-sm text-slate-500">Requested: {booking.bookingDate || booking.date} | {booking.timeSlot}</p>
          <p className="text-sm text-slate-500">Amount: INR {booking.amount}</p>
          {booking.notes && <p className="text-sm text-slate-500">Notes: {booking.notes}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={booking.bookingStatus || booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const isGood = value === "Paid" || value === "Completed" || value === "Confirmed" || value === "Report Ready";
  const isWarning = value === "Pending Approval" || value === "Unpaid" || value === "Processing" || value === "Sample Collected";
  const classes = isGood
    ? "bg-green-100 text-green-700"
    : isWarning
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
}

function Input({ className = "", ...props }) {
  return <input {...props} className={`rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500 ${className}`} />;
}

function EmptyState({ text }) {
  return <div className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

export default PatientDashboard;
