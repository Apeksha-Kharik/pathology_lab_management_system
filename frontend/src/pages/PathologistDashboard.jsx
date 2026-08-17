import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileImage, LogOut, Search, ShieldCheck, Upload, XCircle } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { approveReport, getPathologistProfile, getPathologistReports, rejectReport, uploadPathologistSignature } from "../services/pathologistService";

function PathologistDashboard() {
  const { logout, user, updateUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState(user || {});
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [signatureMessage, setSignatureMessage] = useState({ type: "", text: "" });
  const [uploadingSignature, setUploadingSignature] = useState(false);
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

    Promise.all([getPathologistReports(), getPathologistProfile()])
      .then(([reportData, profileData]) => {
        if (isMounted) {
          setReports(reportData);
          setProfile(profileData);
          updateUser({ ...user, ...profileData });
        }
      })
      .catch(() => alert("Unable to load pathologist dashboard"));

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!profile.signatureUrl) {
      alert("Upload your digital signature before approving a report");
      return;
    }

    try {
      const data = await approveReport(reportId, { pathologistRemarks });
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
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["image/png", "image/jpeg"].includes(file.type) || !["png", "jpg", "jpeg"].includes(extension)) {
      setSignatureMessage({ type: "error", text: "Only PNG, JPG and JPEG files are allowed." });
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignatureMessage({ type: "error", text: "Signature image must be 2 MB or smaller." });
      event.target.value = "";
      return;
    }
    if (signaturePreview) URL.revokeObjectURL(signaturePreview);
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
    setSignatureMessage({ type: "", text: "" });
  };

  const saveSignature = async () => {
    if (!signatureFile) return setSignatureMessage({ type: "error", text: "Choose a signature image first." });
    if (!profile.qualification?.trim() || !profile.registrationNumber?.trim()) {
      return setSignatureMessage({ type: "error", text: "Qualification and registration number are required." });
    }
    try {
      setUploadingSignature(true);
      const data = await uploadPathologistSignature({ file: signatureFile, qualification: profile.qualification.trim(), registrationNumber: profile.registrationNumber.trim() });
      setProfile(data.user);
      updateUser({ ...user, ...data.user });
      setSignatureFile(null);
      if (signaturePreview) URL.revokeObjectURL(signaturePreview);
      setSignaturePreview("");
      setSignatureMessage({ type: "success", text: data.message });
    } catch (error) {
      setSignatureMessage({ type: "error", text: error.response?.data?.message || "Signature upload failed." });
    } finally {
      setUploadingSignature(false);
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

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">{sectionTitle(activeSection)}</h2>
            <StatusBadge value={sectionStatus(activeSection)} />
          </div>
          <ReportsTable reports={activeReports} section={activeSection} onView={setSelectedReport} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><ShieldCheck size={22} /></div>
            <div><h2 className="font-bold text-slate-900">Digital Signature</h2><p className="text-xs text-slate-500">This signature is securely applied when you approve a report.</p></div>
          </div>
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-600">Qualification<input value={profile.qualification || ""} onChange={(e) => setProfile({...profile, qualification: e.target.value})} placeholder="MD Pathology" className="mt-2 w-full rounded-md border border-slate-200 p-3 font-normal outline-none focus:border-blue-500" /></label>
                <label className="text-sm font-bold text-slate-600">Registration Number<input value={profile.registrationNumber || ""} onChange={(e) => setProfile({...profile, registrationNumber: e.target.value})} placeholder="Medical council registration no." className="mt-2 w-full rounded-md border border-slate-200 p-3 font-normal outline-none focus:border-blue-500" /></label>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50">
                <Upload size={18} /> {signatureFile ? signatureFile.name : profile.signatureUrl ? "Choose replacement signature" : "Choose signature image"}
                <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={handleSignatureUpload} className="hidden" />
              </label>
              <p className="text-xs text-slate-500">PNG, JPG or JPEG only. Maximum file size: 2 MB.</p>
              {signatureMessage.text && <p className={`rounded-md px-3 py-2 text-sm font-semibold ${signatureMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{signatureMessage.text}</p>}
              <button type="button" disabled={!signatureFile || uploadingSignature} onClick={saveSignature} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Upload size={16} /> {uploadingSignature ? "Uploading..." : profile.signatureUrl ? "Replace Signature" : "Upload Signature"}
              </button>
            </div>
            <div className="flex min-h-44 items-center justify-center rounded-lg border border-slate-200 bg-white p-4">
              {(signaturePreview || profile.signatureUrl) ? <div className="text-center"><img src={signaturePreview || signatureSource(profile.signatureUrl)} alt="Pathologist signature preview" className="mx-auto max-h-24 max-w-full object-contain" /><p className="mt-3 text-xs font-bold text-slate-500">{signaturePreview ? "Preview - not uploaded yet" : "Current digital signature"}</p></div> : <div className="text-center text-slate-400"><FileImage className="mx-auto mb-2" size={36} /><p className="text-sm">No signature uploaded</p></div>}
            </div>
          </div>
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
            <th className="p-3">Report ID</th>
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
              <td className="p-3 font-bold text-blue-700">{report.reportId || "N/A"}</td>
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
            <p className="text-sm font-bold text-blue-700">Report ID: {report.reportId || "N/A"}</p>
            <p className="text-sm text-slate-500">Patient: {report.userId?.name || report.bookingId?.name || "N/A"}</p>
          </div>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">Close</button>
        </div>

        <div className="mb-5 grid gap-3 text-sm md:grid-cols-3">
          <Detail label="Patient Name" value={report.userId?.name || report.bookingId?.name || "N/A"} />
          <Detail label="Report ID" value={report.reportId || "N/A"} />
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
          <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
            <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
              {report.pathologistSignatureImage && <img src={signatureSource(report.pathologistSignatureImage)} alt="Approving pathologist signature" className="mx-auto mb-2 max-h-20 max-w-48 object-contain" />}
              <p className="font-bold text-slate-900">{report.approvedPathologistName || report.approvedBy?.name || report.pathologistSignature || "Pathologist"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Approved: {formatDateTime(report.approvedAt)}</p>
            </div>
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

function formatDateTime(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN");
}

function signatureSource(signatureUrl) {
  if (!signatureUrl || signatureUrl.startsWith("http") || signatureUrl.startsWith("blob:")) return signatureUrl || "";
  return `http://localhost:5000${signatureUrl}`;
}

function formatInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default PathologistDashboard;
