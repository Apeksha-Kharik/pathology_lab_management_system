import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Edit3, Eye, FileText, FlaskConical, LogOut, PlayCircle, Save, Search, Send } from "lucide-react";
import { useAuth } from "../context/useAuth";
import {
  getTechnicianBookings,
  saveTechnicianReportDraft,
  startTechnicianReportEntry,
  startTechnicianTest,
  submitTechnicianReport,
  updateTechnicianStatus
} from "../services/technicianService";
import logo from "../assets/logo.png";

const blankResult = { parameter: "", value: "", unit: "", normalRange: "" };
const technicianFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";

const getReportTemplate = (booking) => {
  if (booking.bookingType === "Package" && Array.isArray(booking.packageTests) && booking.packageTests.length) {
    return booking.packageTests.flatMap((test) => {
      const rows = Array.isArray(test.reportTemplate) && test.reportTemplate.length ? test.reportTemplate : [{ parameter: "Result", value: "", unit: "", referenceRange: "" }];
      return rows.map((row) => ({ ...row, parameter: test.testName + " - " + row.parameter }));
    });
  }
  const templates = [booking.testId?.reportTemplate, booking.packageId?.reportTemplate];
  return templates.find((template) => Array.isArray(template) && template.length > 0) || [];
};

const getReportTemplateDetails = (booking) => {
  const source = [booking.testId, booking.packageId].find((item) => item?.reportTemplate?.length || item?.reportLetterhead || item?.reportDescription);
  return {
    letterhead: booking.report?.reportLetterhead || source?.reportLetterhead || "",
    description: booking.report?.reportDescription || source?.reportDescription || "",
    hasTemplate: Boolean(source?.reportTemplate?.length)
  };
};

const toResultRow = (row = {}) => ({
  parameter: row.parameter || "",
  value: row.value || "",
  unit: row.unit || "",
  normalRange: row.normalRange || row.referenceRange || ""
});

const buildReportRows = (booking) => {
  const savedResults = booking.report?.results || [];
  const template = getReportTemplate(booking);

  if (!template.length) return savedResults.length ? savedResults.map(toResultRow) : [blankResult];

  const savedByParameter = new Map(
    savedResults
      .filter((row) => row.parameter)
      .map((row) => [row.parameter.trim().toLowerCase(), row])
  );
  const templateRows = template.map((templateRow) => {
    const savedRow = savedByParameter.get((templateRow.parameter || "").trim().toLowerCase());
    return toResultRow({ ...templateRow, ...savedRow });
  });
  const additionalRows = savedResults.filter((row) => !template.some(
    (templateRow) => (templateRow.parameter || "").trim().toLowerCase() === (row.parameter || "").trim().toLowerCase()
  ));

  return [...templateRows, ...additionalRows.map(toResultRow)];
};

function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reportBooking, setReportBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [activeView, setActiveView] = useState("assigned");

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

  const technicianViews = [
    {
      id: "assigned",
      label: "Sample Queue",
      description: "Assigned patients waiting for sample collection or test start.",
      icon: FlaskConical
    },
    {
      id: "entry",
      label: "Result Entry",
      description: "Started tests ready for draft or final report submission.",
      icon: Edit3
    },
    {
      id: "corrections",
      label: "Corrections",
      description: "Rejected reports that need technician updates.",
      icon: AlertCircle
    },
    {
      id: "submitted",
      label: "Submitted Reports",
      description: "Reports already sent for pathologist review or approval.",
      icon: FileText
    }
  ];

  const activeViewDetails = technicianViews.find((view) => view.id === activeView) || technicianViews[0];

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
    setBookings((current) => current.map((booking) => booking._id === updatedBooking._id ? { ...booking, ...updatedBooking, report: updatedBooking.report || booking.report } : booking));
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

  const handleOpenReportEntry = async (booking) => {
    try {
      const data = await startTechnicianReportEntry(booking._id);
      const nextBooking = { ...booking, report: { ...(booking.report || {}), ...(data.report || {}) } };
      setReportBooking(nextBooking);
      replaceBooking(nextBooking);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to start report entry");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#f6fbf8] text-slate-900" style={{ fontFamily: technicianFont }}>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 shadow-lg shadow-emerald-950/5 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[auto_minmax(320px,1fr)_auto] lg:items-center lg:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
            <div>
              <span className="block text-xl font-black leading-none tracking-tight text-emerald-950">INDIPATH</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Technician Lab Desk</span>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-3xl gap-2 md:grid-cols-[minmax(180px,1fr)_150px_180px]">
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 shadow-inner shadow-emerald-950/5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
              <Search size={18} className="shrink-0 text-emerald-700" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search booking ID, patient, test"
                className="w-full bg-transparent font-semibold outline-none placeholder:text-slate-400"
              />
            </label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
              <option value="">All tests</option>
              {testOptions.map((testName) => <option key={testName} value={testName}>{testName}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="hidden items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <FlaskConical size={18} />
              </span>
              <div className="max-w-36">
                <p className="truncate text-sm font-black text-emerald-950">{user?.name || "Technician"}</p>
                <p className="truncate text-xs font-semibold text-slate-500">{user?.email || "Lab Desk"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <TechnicianDeskNav activeView={activeView} onChange={setActiveView} views={technicianViews} />

        <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
          <SectionHeader description={activeViewDetails.description} title={activeViewDetails.label} />
          {activeView === "assigned" && (
            <AssignedTable bookings={assignedTests} onView={setSelectedBooking} onSampleCollected={handleSampleCollected} onStart={handleStartTest} />
          )}
          {activeView === "entry" && (
            <BookingCards bookings={pendingSubmissions} onView={setSelectedBooking} onReport={handleOpenReportEntry} reportLabel="Enter Report" />
          )}
          {activeView === "corrections" && (
            <BookingCards bookings={correctionNeeded} onView={setSelectedBooking} onReport={handleOpenReportEntry} reportLabel="Edit Report" />
          )}
          {activeView === "submitted" && (
            <CompletedTable bookings={completedReports} onView={setSelectedBooking} onReport={setReportBooking} />
          )}
        </section>
      </main>

      {selectedBooking && <DetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
      {reportBooking && <ReportModal booking={reportBooking} onClose={() => setReportBooking(null)} onDone={() => { setReportBooking(null); loadBookings(); }} />}
    </div>
  );
}

function TechnicianDeskNav({ activeView, onChange, views }) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {views.map((view) => {
          const Icon = view.icon;
          const active = activeView === view.id;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onChange(view.id)}
              className={`flex min-h-24 items-center gap-4 rounded-2xl px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${active ? "bg-emerald-700 text-white shadow-lg shadow-emerald-950/10" : "bg-emerald-50 text-emerald-950 hover:bg-emerald-100"}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/15 text-white" : "bg-white text-emerald-700"}`}>
                <Icon size={21} />
              </span>
              <span>
                <span className="block text-sm font-black">{view.label}</span>
                <span className={`mt-1 block text-xs font-semibold ${active ? "text-emerald-50/85" : "text-slate-500"}`}>{view.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ description, title }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Technician Workflow</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function AssignedTable({ bookings, onView, onSampleCollected, onStart }) {
  if (!bookings.length) return <Empty text="No newly assigned tests." />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
          <tr>
            <th className="p-3">Booking ID</th>
            <th className="p-3">Sample ID</th>
            <th className="p-3">Patient Name</th>
            <th className="p-3">Test Name</th>
            <th className="p-3">Assigned Date</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-emerald-100 text-slate-600 transition-colors hover:bg-emerald-50/50">
              <td className="p-3 font-black text-emerald-800">{displayBookingId(booking)}</td>
              <td className="p-3 font-black text-emerald-700">{booking.sampleId || "Generated on start"}</td>
              <td className="p-3 font-bold text-slate-800">{booking.name}</td>
              <td className="p-3">{booking.testName}</td>
              <td className="p-3">{formatDate(booking.updatedAt || booking.createdAt)}</td>
              <td className="p-3">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onView(booking)} className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50">
                    <Eye size={14} /> View
                  </button>
                  {booking.sampleStatus !== "Collected" && (
                    <button onClick={() => onSampleCollected(booking._id)} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800">
                      Sample Collected
                    </button>
                  )}
                  <button onClick={() => onStart(booking._id)} disabled={booking.sampleStatus !== "Collected"} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
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
        <div key={booking._id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{displayBookingId(booking)}</p>
              {booking.sampleId && <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Sample ID: {booking.sampleId}</p>}
              {booking.report?.reportId && <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Report ID: {booking.report.reportId}</p>}
              <h3 className="mt-2 text-lg font-black tracking-tight text-emerald-950">{booking.testName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">Patient: {booking.name}</p>
              <p className="text-sm font-semibold text-slate-500">Report: {booking.report?.status || "Not Started"}</p>
              {booking.report?.rejectionReason && <p className="mt-2 text-sm font-semibold text-red-600">Reason: {booking.report.rejectionReason}</p>}
            </div>
            <StatusBadge value={booking.report?.status || booking.bookingStatus} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => onView(booking)} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50">View Details</button>
            {onReport && (
              <button onClick={() => onReport(booking)} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800">
                <Edit3 size={14} /> {reportLabel}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletedTable({ bookings, onView, onReport }) {
  if (!bookings.length) return <Empty text="No submitted reports yet." />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
          <tr>
            <th className="p-3">Booking ID</th>
            <th className="p-3">Report ID</th>
            <th className="p-3">Patient Name</th>
            <th className="p-3">Test Name</th>
            <th className="p-3">Submitted Date</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">See Details</th>
            <th className="p-3 text-right">See Report</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-emerald-100 text-slate-600 transition-colors hover:bg-emerald-50/50">
              <td className="p-3 font-black text-emerald-800">{displayBookingId(booking)}</td>
              <td className="p-3 font-black text-emerald-700">{booking.report?.reportId || "N/A"}</td>
              <td className="p-3 font-bold text-slate-800">{booking.name}</td>
              <td className="p-3">{booking.testName}</td>
              <td className="p-3">{formatDate(booking.report?.submittedAt || booking.report?.updatedAt)}</td>
              <td className="p-3"><StatusBadge value={booking.report?.status} /></td>
              <td className="p-3 text-right">
                <button onClick={() => onView(booking)} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-50">See Details</button>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => onReport(booking)} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800">
                  <FileText size={14} /> See Report
                </button>
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
        <Detail label="Booking ID" value={displayBookingId(booking)} />
        <Detail label="Patient ID" value={booking.patientCode || "N/A"} />
        <Detail label="Sample ID" value={booking.sampleId || "Generated when test starts"} />
        <Detail label="Report ID" value={booking.report?.reportId || "Generated when report entry starts"} />
        <Detail label="Patient Name" value={booking.name} />
        <Detail label="Age" value={booking.age || "N/A"} />
        <Detail label="Gender" value={booking.gender || "N/A"} />
        <Detail label="Phone Number" value={booking.phone} />
        <Detail label="Email" value={booking.email || "N/A"} />
        <Detail label="Test Name" value={booking.testName} />
        <Detail label="Booking Date" value={booking.bookingDate || booking.date} />
        <Detail label="Time Slot" value={booking.timeSlot || "N/A"} />
        <Detail label="Sample Collection" value={booking.collectionType || "N/A"} />
        <Detail label="Status" value={booking.bookingStatus} />
        <Detail label="Report Status" value={booking.report?.status || "Not Started"} />
        {booking.address && <Detail label="Address" value={booking.address} wide />}
        <Detail label="Prescribed By / Doctor" value={booking.prescribedBy || booking.doctorNotes || "N/A"} wide />
        <Detail label="Receptionist Notes" value={booking.notes || "N/A"} wide />
        {booking.report?.rejectionReason && <Detail label="Correction Reason" value={booking.report.rejectionReason} wide />}
      </div>
    </Modal>
  );
}

function ReportModal({ booking, onClose, onDone }) {
  const isLocked = ["Pending Approval", "Pending Review", "Approved"].includes(booking.report?.status);
  const templateDetails = getReportTemplateDetails(booking);
  const [technicianRemarks, setTechnicianRemarks] = useState(booking.report?.technicianRemarks || "");
  const [results, setResults] = useState(() => buildReportRows(booking));

  const updateResult = (index, field, value) => {
    setResults(results.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const cleanPayload = () => ({
    technicianRemarks,
    results: results
      .map((row) => ({
        parameter: row.parameter.trim(),
        value: row.value.trim(),
        normalRange: row.normalRange.trim(), unit: row.unit.trim()
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
      {templateDetails.letterhead && (
        <div className="mb-5 border-b-2 border-emerald-700 pb-4 text-center whitespace-pre-line">
          <p className="text-lg font-black text-emerald-950">{templateDetails.letterhead}</p>
          <p className="mt-2 text-sm text-slate-600">{templateDetails.description}</p>
        </div>
      )}
      {!templateDetails.hasTemplate && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No admin report template is configured for this test. Ask an admin to add the required parameters in Report Templates.</p>
      )}
      {booking.report?.rejectionReason && (
        <div className="mb-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Correction needed: {booking.report.rejectionReason}
        </div>
      )}

      <div className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-3">
        <Detail label="Report ID" value={booking.report?.reportId || "Generating"} />
        <Detail label="Sample ID" value={booking.sampleId || "N/A"} />
        <Detail label="Patient Name" value={booking.name || "N/A"} />
        <Detail label="Age / Gender" value={[booking.age, booking.gender].filter(Boolean).join(" / ") || "N/A"} />
        <Detail label="Phone" value={booking.phone || "N/A"} />
        <Detail label="Booking ID" value={displayBookingId(booking)} />
        <Detail label="Test / Package" value={booking.testName || "N/A"} />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Parameter</th>
              <th className="p-3">Result</th>
              <th className="p-3">Unit</th><th className="p-3">Normal Range</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="p-2"><Input disabled={isLocked} placeholder="Parameter" value={row.parameter} onChange={(e) => updateResult(index, "parameter", e.target.value)} /></td>
                <td className="p-2"><Input disabled={isLocked} placeholder="Result" value={row.value} onChange={(e) => updateResult(index, "value", e.target.value)} /></td>
                <td className="p-2"><Input disabled={isLocked} placeholder="Unit" value={row.unit} onChange={(e) => updateResult(index, "unit", e.target.value)} /></td><td className="p-2"><Input disabled={isLocked} placeholder="Reference range" value={row.normalRange} onChange={(e) => updateResult(index, "normalRange", e.target.value)} /></td>
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
        className="mt-2 min-h-24 w-full rounded-md border border-slate-200 p-3 outline-none focus:border-emerald-500 disabled:bg-slate-50"
      />

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">Close</button>
        {!isLocked && (
          <>
            <button onClick={saveDraft} className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
              <Save size={16} /> Save Report
            </button>
            <button onClick={finalSubmit} className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
              <Send size={16} /> Submit to Pathologist
            </button>
          </>
        )}
      </div>
    </Modal>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl shadow-emerald-950/15">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-emerald-950">{title}</h2>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800">Close</button>
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
        ? "bg-emerald-100 text-emerald-700"
        : value === "Processing" || value === "Draft"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value || "N/A"}</span>;
}

function Input(props) {
  return <input {...props} className="w-full rounded-xl border border-emerald-100 bg-emerald-50/50 p-2 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white disabled:bg-slate-50" />;
}

function Empty({ text }) {
  return <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center text-sm font-bold text-slate-500">{text}</p>;
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
