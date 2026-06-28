import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, LogOut, Search, Upload, XCircle } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { approveReport, getPathologistReports, rejectReport } from "../services/pathologistService";

function PathologistDashboard() {
  const { logout, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [signature, setSignature] = useState(user?.qualification ? `${user.name}, ${user.qualification}` : user?.name || "");
  const [signatureImage, setSignatureImage] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeSection, setActiveSection] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");

  const loadReports = async () => {
    setReports(await getPathologistReports());
  };

  useEffect(() => {
    let isMounted = true;

    getPathologistReports()
      .then((data) => {
        if (isMounted) setReports(data);
      })
      .catch(() => alert("Unable to load reports"));

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const bookingId = report.bookingId?.bookingCode || report.bookingId?._id || "";
      const patientName = report.userId?.name || report.bookingId?.name || "";
      const submittedDate = formatInputDate(report.submittedAt || report.updatedAt);

      const matchesSearch = !query || [bookingId, patientName, report.testName]
        .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesDate = !dateFilter || submittedDate === dateFilter;
      const matchesStatus = !statusFilter || report.status === statusFilter;
      const matchesTest = !testFilter || report.testName === testFilter;

      return matchesSearch && matchesDate && matchesStatus && matchesTest;
    });
  }, [reports, searchTerm, dateFilter, statusFilter, testFilter]);

  const pendingReports = useMemo(() => filteredReports.filter((report) => ["Pending Approval", "Pending Review"].includes(report.status)), [filteredReports]);
  const approvedReports = useMemo(() => filteredReports.filter((report) => report.status === "Approved"), [filteredReports]);
  const rejectedReports = useMemo(() => filteredReports.filter((report) => report.status === "Rejected"), [filteredReports]);
  const correctedReports = useMemo(() => pendingReports.filter((report) => report.rejectionReason).length, [pendingReports]);
  const testOptions = useMemo(() => [...new Set(reports.map((report) => report.testName).filter(Boolean))].sort(), [reports]);

  const activeReports = activeSection === "approved"
    ? approvedReports
    : activeSection === "rejected"
      ? rejectedReports
      : pendingReports;

  const handleApprove = async (reportId, pathologistRemarks) => {
    if (!signature.trim()) {
      alert("Enter pathologist signature");
      return;
    }

    try {
      const data = await approveReport(reportId, {
        pathologistSignature: signature.trim(),
        pathologistRemarks,
        pathologistSignatureImage: signatureImage
      });
      alert(data.message);
      setSelectedReport(null);
      await loadReports();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (reportId, payload) => {
    if (!payload.rejectionReason.trim()) {
      alert("Reason for rejection is required");
      return;
    }

    try {
      const data = await rejectReport(reportId, payload);
      alert(data.message);
      setSelectedReport(null);
      await loadReports();
    } catch (error) {
      alert(error.response?.data?.message || "Rejection failed");
    }
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setSignatureImage(reader.result);
    reader.readAsDataURL(file);
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
            <h1 className="text-2xl font-bold">Pathologist Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <DashboardCard label="Pending Reports" value={pendingReports.length} active={activeSection === "pending"} onClick={() => setActiveSection("pending")} />
          <DashboardCard label="Approved Reports" value={approvedReports.length} active={activeSection === "approved"} onClick={() => setActiveSection("approved")} />
          <DashboardCard label="Rejected Reports" value={rejectedReports.length} active={activeSection === "rejected"} onClick={() => setActiveSection("rejected")} />
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-2">
          <Notification text={`${pendingReports.length} new reports waiting approval`} />
          <Notification text={`${correctedReports} corrected reports resubmitted`} />
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">Pathologist Signature</label>
              <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Dr. Name, Qualification" className="w-full rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">Upload Signature Image</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <Upload size={18} /> {signatureImage ? "Signature image selected" : "Choose image"}
                <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
              </label>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_170px_190px_220px]">
            <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search booking ID, patient, test" className="w-full outline-none" />
            </label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 outline-none" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 outline-none">
              <option value="">All statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 outline-none">
              <option value="">All tests</option>
              {testOptions.map((testName) => <option key={testName} value={testName}>{testName}</option>)}
            </select>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">{sectionTitle(activeSection)}</h2>
            <StatusBadge value={sectionStatus(activeSection)} />
          </div>
          <ReportsTable reports={activeReports} section={activeSection} onView={setSelectedReport} />
        </section>
      </main>

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

function ReportsTable({ reports, section, onView }) {
  if (!reports.length) {
    return <p className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">No reports in this section.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Booking ID</th>
            <th className="p-3">Patient Name</th>
            <th className="p-3">Test Name</th>
            {section === "approved" ? <th className="p-3">Approved Date</th> : <th className="p-3">Technician Name</th>}
            {section === "rejected" ? <th className="p-3">Rejection Reason</th> : <th className="p-3">Submitted Date</th>}
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id} className="border-t border-slate-100">
              <td className="p-3 font-bold">{report.bookingId?.bookingCode || report.bookingId?._id || "N/A"}</td>
              <td className="p-3">{report.userId?.name || report.bookingId?.name || "N/A"}</td>
              <td className="p-3">{report.testName}</td>
              <td className="p-3">{section === "approved" ? formatDate(report.approvedAt) : report.technicianId?.name || "N/A"}</td>
              <td className="p-3">{section === "rejected" ? report.rejectionReason || "N/A" : formatDate(report.submittedAt || report.updatedAt)}</td>
              <td className="p-3 text-right">
                <button onClick={() => onView(report)} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                  <Eye size={14} /> View Report
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportModal({ report, onClose, onApprove, onReject }) {
  const canReview = ["Pending Approval", "Pending Review"].includes(report.status);
  const [pathologistRemarks, setPathologistRemarks] = useState(report.pathologistRemarks || "");
  const [rejectionReason, setRejectionReason] = useState(report.rejectionReason || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{report.bookingId?.bookingCode || report.bookingId?._id}</p>
            <h2 className="text-xl font-bold">{report.testName}</h2>
            <p className="text-sm text-slate-500">Patient: {report.userId?.name || report.bookingId?.name || "N/A"}</p>
          </div>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button>
        </div>

        <div className="mb-5 grid gap-3 text-sm md:grid-cols-3">
          <Detail label="Patient Name" value={report.userId?.name || report.bookingId?.name || "N/A"} />
          <Detail label="Age" value={report.bookingId?.age || "N/A"} />
          <Detail label="Gender" value={report.bookingId?.gender || "N/A"} />
          <Detail label="Test Name" value={report.testName} />
          <Detail label="Technician" value={report.technicianId?.name || "N/A"} />
          <Detail label="Submitted Date" value={formatDate(report.submittedAt || report.updatedAt)} />
        </div>

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
              {report.results.map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="p-3 font-semibold">{row.parameter}</td>
                  <td className="p-3">{row.value} {row.unit}</td>
                  <td className="p-3">{row.normalRange || row.referenceRange || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Detail label="Technician Remarks" value={report.technicianRemarks || "N/A"} />
          <Detail label="Current Status" value={report.finalStatus || report.status} />
        </div>

        <label className="mt-5 block text-sm font-bold text-slate-600">Pathologist Remarks</label>
        <textarea
          value={pathologistRemarks}
          onChange={(e) => setPathologistRemarks(e.target.value)}
          placeholder="Results verified."
          className="mt-2 min-h-24 w-full rounded-md border border-slate-200 p-3 outline-none focus:border-blue-500"
        />

        {canReview && (
          <>
            <label className="mt-4 block text-sm font-bold text-slate-600">Reason for rejection</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Incorrect values entered"
              className="mt-2 min-h-20 w-full rounded-md border border-slate-200 p-3 outline-none focus:border-red-500"
            />
          </>
        )}

        {report.status === "Rejected" && <Detail label="Rejection Reason" value={report.rejectionReason || "N/A"} />}
        {report.status === "Approved" && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Detail label="Pathologist Signature" value={report.pathologistSignature || "N/A"} />
            <Detail label="Approved Date" value={formatDate(report.approvedAt)} />
          </div>
        )}

        {canReview && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button onClick={() => onReject(report._id, { rejectionReason, pathologistRemarks })} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
              <XCircle size={16} /> Reject Report
            </button>
            <button onClick={() => onApprove(report._id, pathologistRemarks)} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
              <CheckCircle2 size={16} /> Approve Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Notification({ text }) {
  return <div className="rounded-md bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{text}</div>;
}

function DashboardCard({ label, value, active, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-lg border p-5 text-left transition ${active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-700">{value}</p>
    </button>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function StatusBadge({ value }) {
  const classes = value === "Approved"
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-violet-100 text-violet-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
}

function sectionTitle(section) {
  if (section === "approved") return "Approved Reports";
  if (section === "rejected") return "Rejected Reports";
  return "Pending Reports";
}

function sectionStatus(section) {
  if (section === "approved") return "Approved";
  if (section === "rejected") return "Rejected";
  return "Pending Approval";
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-IN");
}

function formatInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default PathologistDashboard;
