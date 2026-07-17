import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, LogOut, Search, TestTube2, User } from "lucide-react";
import { useAuth } from "../context/useAuth";
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
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg">
              {user?.name?.charAt(0) || "P"}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">INDIPATH Patient Portal</p>
              <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {user?.name || "Patient"}</h1>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Summary cards removed as requested */}

        {/* Notifications removed as requested */}

        <nav className="mb-6 flex flex-wrap gap-3">
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

// SummaryCard removed — no longer used in patient dashboard

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-semibold border ${active ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
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
          <div key={test._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition">
            <div className="mb-4 flex items-start justify-between gap-3">
              <TestTube2 className="mt-1 text-blue-600" size={24} />
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-500">{test.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{test.testName}</h3>
            <p className="mt-2 min-h-12 text-sm text-slate-600">{test.description || "Diagnostic lab test with verified reporting."}</p>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-lg font-extrabold text-slate-900">INR {test.price}</span>
              <button onClick={() => onBook(test)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow">
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
    age: "",
    gender: "",
    sampleType: "",
    prescribedBy: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.bookingDate || !form.timeSlot || !form.age || !form.gender) {
      alert("Please enter patient age, gender, preferred date and time slot");
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
        <Input name="age" type="number" min="0" max="130" placeholder="Patient age" value={form.age} onChange={handleChange} />
        <Input name="prescribedBy" placeholder="Prescribed by" value={form.prescribedBy} onChange={handleChange} />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500"
        >
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
        <Input name="bookingDate" type="date" value={form.bookingDate} onChange={handleChange} />
        <Input name="sampleType" placeholder="Sample type, if known" value={form.sampleType} onChange={handleChange} />
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
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="w-full" />
          <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" className="w-full" />
        </div>
        <p className="my-4 rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Age, gender and sample details are captured during each test booking so every test request has accurate visit-specific information.
        </p>
        <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Update Profile</button>
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
          {booking.prescribedBy && <p className="text-sm text-slate-500">Prescribed by: {booking.prescribedBy}</p>}
          {booking.notes && <p className="text-sm text-slate-500">Notes: {booking.notes}</p>}
          {booking.rejectionReason && <p className="text-sm text-red-600">Rejection reason: {booking.rejectionReason}</p>}
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
  const isGood = value === "Paid" || value === "Completed" || value === "Confirmed" || value === "Report Ready" || value === "Arrived";
  const isWarning = value === "Pending Approval" || value === "Unpaid" || value === "Technician Assigned" || value === "Processing" || value === "Sample Collected" || value === "Pending Report Approval";
  const classes = isGood
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
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
