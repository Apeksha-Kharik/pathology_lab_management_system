import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, LogOut, PlayCircle, Save, Search, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getTechnicianBookings,
  saveTechnicianReportDraft,
  startTechnicianTest,
  submitTechnicianReport,
  updateTechnicianStatus
} from "../services/technicianService";

const blankResult = { parameter: "", value: "", normalRange: "" };

function TechnicianDashboard() {
  const { logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reportBooking, setReportBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");

  const loadBookings = async () => {
    setBookings(await getTechnicianBookings());
  };

  useEffect(() => {
    let isMounted = true;

    getTechnicianBookings()
      .then((data) => {
        if (isMounted) setBookings(data);
      })
      .catch(() => alert("Unable to load technician bookings"));

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch = !query || [
        booking.bookingCode,
        booking._id,
        booking.name,
        booking.testName
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesDate = !dateFilter || formatInputDate(booking.report?.submittedAt || booking.updatedAt || booking.createdAt) === dateFilter;
      const matchesTest = !testFilter || booking.testName === testFilter;

      return matchesSearch && matchesDate && matchesTest;
    });
  }, [bookings, searchTerm, dateFilter, testFilter]);

  const assignedTests = useMemo(() => {
    return filteredBookings.filter((booking) => ["Technician Assigned", "Sample Collected"].includes(booking.bookingStatus) && !booking.testStarted);
  }, [filteredBookings]);

  const pendingSubmissions = useMemo(() => {
    return filteredBookings.filter((booking) => {
      const reportStatus = booking.report?.status;
      return (booking.testStarted || booking.bookingStatus === "Processing") && (!reportStatus || reportStatus === "Draft");
    });
  }, [filteredBookings]);

  const correctionNeeded = useMemo(() => {
    return filteredBookings.filter((booking) => booking.report?.status === "Rejected");
  }, [filteredBookings]);

  const completedReports = useMemo(() => {
    return filteredBookings.filter((booking) => ["Pending Approval", "Pending Review", "Approved"].includes(booking.report?.status));
  }, [filteredBookings]);

  const testOptions = useMemo(() => {
    return [...new Set(bookings.map((booking) => booking.testName).filter(Boolean))].sort();
  }, [bookings]);

  const handleStartTest = async (bookingId) => {
    try {
      const data = await startTechnicianTest(bookingId);
      alert(data.message);
      replaceBooking(data.booking);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to start test");
    }
  };

  const replaceBooking = (updatedBooking) => {
    if (!updatedBooking?._id) return;
    setBookings((current) => current.map((booking) => booking._id === updatedBooking._id ? { ...booking, ...updatedBooking, report: booking.report } : booking));
  };

  const handleSampleCollected = async (bookingId) => {
    try {
      const data = await updateTechnicianStatus(bookingId, "Sample Collected");
      alert(data.message);
      replaceBooking(data.booking);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to mark sample collected");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">INDIPATH</p>
            <h1 className="text-2xl font-bold">Technician Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Summary label="Newly Assigned" value={assignedTests.length} />
          <Summary label="Pending Submissions" value={pendingSubmissions.length} />
          <Summary label="Rejected Reports" value={correctionNeeded.length} />
          <Summary label="Submitted Reports" value={completedReports.length} />
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
            <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search booking ID, patient, test"
                className="w-full outline-none"
              />
            </label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 outline-none" />
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 outline-none">
              <option value="">All tests</option>
              {testOptions.map((testName) => <option key={testName} value={testName}>{testName}</option>)}
            </select>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold">Newly Assigned Tests</h2>
          <AssignedTable bookings={assignedTests} onView={setSelectedBooking} onSampleCollected={handleSampleCollected} onStart={handleStartTest} />
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold">Pending Submissions</h2>
          <BookingCards bookings={pendingSubmissions} onView={setSelectedBooking} onReport={setReportBooking} reportLabel="Enter Report" />
        </section>

        <section className="mb-6 rounded-lg border border-red-100 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold text-red-700">Correction Needed</h2>
          <BookingCards bookings={correctionNeeded} onView={setSelectedBooking} onReport={setReportBooking} reportLabel="Edit Report" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold">Submitted / Waiting Approval</h2>
          <CompletedTable bookings={completedReports} onView={setSelectedBooking} />
        </section>
      </main>

      {selectedBooking && <DetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
      {reportBooking && <ReportModal booking={reportBooking} onClose={() => setReportBooking(null)} onDone={() => { setReportBooking(null); loadBookings(); }} />}
    </div>
  );
}

function AssignedTable({ bookings, onView, onSampleCollected, onStart }) {
  if (!bookings.length) return <Empty text="No newly assigned tests." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Booking ID</th>
            <th className="p-3">Patient Name</th>
            <th className="p-3">Test Name</th>
            <th className="p-3">Assigned Date</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-slate-100">
              <td className="p-3 font-bold">{displayBookingId(booking)}</td>
              <td className="p-3">{booking.name}</td>
              <td className="p-3">{booking.testName}</td>
              <td className="p-3">{formatDate(booking.updatedAt || booking.createdAt)}</td>
              <td className="p-3">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onView(booking)} className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">
                    <Eye size={14} /> View
                  </button>
                  {booking.sampleStatus !== "Collected" && (
                    <button onClick={() => onSampleCollected(booking._id)} className="flex items-center gap-1 rounded-md bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700">
                      Sample Collected
                    </button>
                  )}
                  <button onClick={() => onStart(booking._id)} disabled={booking.sampleStatus !== "Collected"} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <PlayCircle size={14} /> Start Test
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingCards({ bookings, onView, onReport, reportLabel }) {
  if (!bookings.length) return <Empty text="No tests in this section." />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookings.map((booking) => (
        <div key={booking._id} className="rounded-md border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">{displayBookingId(booking)}</p>
              <h3 className="font-bold">{booking.testName}</h3>
              <p className="text-sm text-slate-500">Patient: {booking.name}</p>
              <p className="text-sm text-slate-500">Report: {booking.report?.status || "Not Started"}</p>
              {booking.report?.rejectionReason && <p className="mt-2 text-sm font-semibold text-red-600">Reason: {booking.report.rejectionReason}</p>}
            </div>
            <StatusBadge value={booking.report?.status || booking.bookingStatus} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => onView(booking)} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">View Details</button>
            {onReport && (
              <button onClick={() => onReport(booking)} className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                <Edit3 size={14} /> {reportLabel}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletedTable({ bookings, onView }) {
  if (!bookings.length) return <Empty text="No submitted reports yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Booking ID</th>
            <th className="p-3">Patient Name</th>
            <th className="p-3">Test Name</th>
            <th className="p-3">Submitted Date</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-slate-100">
              <td className="p-3 font-bold">{displayBookingId(booking)}</td>
              <td className="p-3">{booking.name}</td>
              <td className="p-3">{booking.testName}</td>
              <td className="p-3">{formatDate(booking.report?.submittedAt || booking.report?.updatedAt)}</td>
              <td className="p-3"><StatusBadge value={booking.report?.status} /></td>
              <td className="p-3 text-right">
                <button onClick={() => onView(booking)} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailsModal({ booking, onClose }) {
  return (
    <Modal title={`Booking Details - ${displayBookingId(booking)}`} onClose={onClose}>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <Detail label="Patient Name" value={booking.name} />
        <Detail label="Age" value={booking.age || "N/A"} />
        <Detail label="Gender" value={booking.gender || "N/A"} />
        <Detail label="Phone Number" value={booking.phone} />
        <Detail label="Test Name" value={booking.testName} />
        <Detail label="Sample Type" value={booking.sampleType || "N/A"} />
        <Detail label="Booking Date" value={booking.bookingDate || booking.date} />
        <Detail label="Status" value={booking.bookingStatus} />
        <Detail label="Report Status" value={booking.report?.status || "Not Started"} />
        <Detail label="Receptionist Notes" value={booking.notes || "N/A"} wide />
        <Detail label="Doctor Notes" value={booking.doctorNotes || "N/A"} wide />
        {booking.report?.rejectionReason && <Detail label="Correction Reason" value={booking.report.rejectionReason} wide />}
      </div>
    </Modal>
  );
}

function ReportModal({ booking, onClose, onDone }) {
  const isLocked = ["Pending Approval", "Pending Review", "Approved"].includes(booking.report?.status);
  const [technicianRemarks, setTechnicianRemarks] = useState(booking.report?.technicianRemarks || "");
  const [results, setResults] = useState(() => {
    if (!booking.report?.results?.length) return [blankResult];
    return booking.report.results.map((row) => ({
      parameter: row.parameter || "",
      value: row.value || "",
      normalRange: row.normalRange || row.referenceRange || ""
    }));
  });

  const updateResult = (index, field, value) => {
    setResults(results.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const cleanPayload = () => ({
    technicianRemarks,
    results: results
      .map((row) => ({
        parameter: row.parameter.trim(),
        value: row.value.trim(),
        normalRange: row.normalRange.trim()
      }))
      .filter((row) => row.parameter && row.value)
  });

  const saveDraft = async () => {
    const payload = cleanPayload();
    if (!payload.results.length) {
      alert("Enter at least one result");
      return;
    }

    try {
      const data = await saveTechnicianReportDraft(booking._id, payload);
      alert(data.message);
      onDone();
    } catch (error) {
      alert(error.response?.data?.message || "Draft save failed");
    }
  };

  const finalSubmit = async () => {
    const payload = cleanPayload();
    if (!payload.results.length) {
      alert("Enter at least one result");
      return;
    }

    try {
      const data = await submitTechnicianReport(booking._id, payload);
      alert(data.message);
      onDone();
    } catch (error) {
      alert(error.response?.data?.message || "Report submission failed");
    }
  };

  return (
    <Modal title={`Result Entry - ${booking.testName}`} onClose={onClose}>
      {booking.report?.rejectionReason && (
        <div className="mb-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Correction needed: {booking.report.rejectionReason}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Parameter</th>
              <th className="p-3">Result</th>
              <th className="p-3">Normal Range</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="p-2"><Input disabled={isLocked} placeholder="Hemoglobin" value={row.parameter} onChange={(e) => updateResult(index, "parameter", e.target.value)} /></td>
                <td className="p-2"><Input disabled={isLocked} placeholder="12.5" value={row.value} onChange={(e) => updateResult(index, "value", e.target.value)} /></td>
                <td className="p-2"><Input disabled={isLocked} placeholder="12-16" value={row.normalRange} onChange={(e) => updateResult(index, "normalRange", e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLocked && (
        <button type="button" onClick={() => setResults([...results, blankResult])} className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50">
          Add Parameter
        </button>
      )}

      <label className="mt-4 block text-sm font-bold text-slate-600">Remarks</label>
      <textarea
        disabled={isLocked}
        value={technicianRemarks}
        onChange={(e) => setTechnicianRemarks(e.target.value)}
        placeholder="Sample quality normal."
        className="mt-2 min-h-24 w-full rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500 disabled:bg-slate-50"
      />

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">Close</button>
        {!isLocked && (
          <>
            <button onClick={saveDraft} className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
              <Save size={16} /> Save Report
            </button>
            <button onClick={finalSubmit} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              <Send size={16} /> Submit Report
            </button>
          </>
        )}
      </div>
    </Modal>
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

function Detail({ label, value, wide }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const classes = value === "Approved" || value === "Report Ready"
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : value === "Pending Approval" || value === "Pending Review"
        ? "bg-violet-100 text-violet-700"
        : value === "Processing" || value === "Draft"
          ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value || "N/A"}</span>;
}

function Input(props) {
  return <input {...props} className="w-full rounded-md border border-slate-200 p-2 outline-none focus:border-blue-500 disabled:bg-slate-50" />;
}

function Empty({ text }) {
  return <p className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</p>;
}

function displayBookingId(booking) {
  return booking.bookingCode || booking._id;
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-IN");
}

function formatInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default TechnicianDashboard;
