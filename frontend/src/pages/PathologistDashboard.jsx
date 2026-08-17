import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, FileImage, FileText, LogOut, Search, ShieldCheck, Upload, XCircle } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { approveReport, getPathologistProfile, getPathologistReports, rejectReport, uploadPathologistSignature } from "../services/pathologistService";
import logo from "../assets/logo.png";

const pathologistFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";

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
  const testOptions = useMemo(() => [...new Set(reports.map((report) => report.testName).filter(Boolean))].sort(), [reports]);

  const activeReports = activeSection === "approved"
    ? approvedReports
    : activeSection === "rejected"
      ? rejectedReports
      : pendingReports;

  const pathologistViews = [
    {
      id: "pending",
      label: "Pending Review",
      description: "Reports assigned for verification and approval.",
      icon: FileText
    },
    {
      id: "approved",
      label: "Approved Reports",
      description: "Final reports already approved with signature.",
      icon: CheckCircle2
    },
    {
      id: "rejected",
      label: "Corrections",
      description: "Reports sent back to technician for correction.",
      icon: AlertCircle
    },
    {
      id: "signature",
      label: "Digital Signature",
      description: "Manage qualification, registration and signature.",
      icon: ShieldCheck
    }
  ];
  const activeViewDetails = pathologistViews.find((view) => view.id === activeSection) || pathologistViews[0];

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
    <div className="min-h-screen bg-[#f6fbf8] text-slate-900" style={{ fontFamily: pathologistFont }}>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 shadow-lg shadow-emerald-950/5 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[auto_auto] lg:items-center lg:justify-between lg:px-6 xl:grid-cols-[auto_minmax(520px,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
            <div className="min-w-0">
              <span className="block text-xl font-black leading-none tracking-tight text-emerald-950">INDIPATH</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 sm:tracking-[0.18em]">Pathologist Review Desk</span>
            </div>
          </div>

          <div className="order-3 grid w-full gap-2 md:grid-cols-2 lg:col-span-2 xl:order-none xl:col-span-1 xl:grid-cols-[minmax(220px,1fr)_145px_165px_170px]">
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 shadow-inner shadow-emerald-950/5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
              <Search size={18} className="shrink-0 text-emerald-700" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search booking ID, patient, test" className="w-full min-w-0 bg-transparent font-semibold outline-none placeholder:text-slate-400" />
            </label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
              <option value="">All statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
              <option value="">All tests</option>
              {testOptions.map((testName) => <option key={testName} value={testName}>{testName}</option>)}
            </select>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-3">
            <div className="hidden items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <ShieldCheck size={18} />
              </span>
              <div className="max-w-36 xl:max-w-40">
                <p className="truncate text-sm font-black text-emerald-950">{profile?.name || user?.name || "Pathologist"}</p>
                <p className="truncate text-xs font-semibold text-slate-500">{profile?.email || user?.email || "Review Desk"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PathologistDeskNav activeView={activeSection} onChange={setActiveSection} views={pathologistViews} />

        {activeSection !== "signature" && (
          <section className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
            <SectionHeader description={activeViewDetails.description} title={activeViewDetails.label} />
            <ReportsTable reports={activeReports} section={activeSection} onView={setSelectedReport} />
          </section>
        )}

        {activeSection === "signature" && (
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
            <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
              <div className="rounded-xl bg-white p-2 text-emerald-700 shadow-sm"><ShieldCheck size={22} /></div>
              <div>
                <h2 className="font-black text-emerald-950">Digital Signature</h2>
                <p className="text-xs font-semibold text-slate-500">This signature is applied when you approve a report.</p>
              </div>
            </div>
            <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-black text-slate-600">Qualification<input value={profile.qualification || ""} onChange={(e) => setProfile({...profile, qualification: e.target.value})} placeholder="MD Pathology" className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="text-sm font-black text-slate-600">Registration Number<input value={profile.registrationNumber || ""} onChange={(e) => setProfile({...profile, registrationNumber: e.target.value})} placeholder="Medical council registration no." className="mt-2 w-full rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white" /></label>
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm font-black text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50">
                  <Upload size={18} /> {signatureFile ? signatureFile.name : profile.signatureUrl ? "Choose replacement signature" : "Choose signature image"}
                  <input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={handleSignatureUpload} className="hidden" />
                </label>
                <p className="text-xs font-semibold text-slate-500">PNG, JPG or JPEG only. Maximum file size: 2 MB.</p>
                {signatureMessage.text && <p className={`rounded-xl px-3 py-2 text-sm font-bold ${signatureMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{signatureMessage.text}</p>}
                <button type="button" disabled={!signatureFile || uploadingSignature} onClick={saveSignature} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Upload size={16} /> {uploadingSignature ? "Uploading..." : profile.signatureUrl ? "Replace Signature" : "Upload Signature"}
                </button>
              </div>
              <div className="flex min-h-44 items-center justify-center rounded-2xl border border-emerald-100 bg-white p-4 shadow-inner shadow-emerald-950/5">
                {(signaturePreview || profile.signatureUrl) ? <div className="text-center"><img src={signaturePreview || signatureSource(profile.signatureUrl)} alt="Pathologist signature preview" className="mx-auto max-h-24 max-w-full object-contain" /><p className="mt-3 text-xs font-bold text-slate-500">{signaturePreview ? "Preview - not uploaded yet" : "Current digital signature"}</p></div> : <div className="text-center text-slate-400"><FileImage className="mx-auto mb-2" size={36} /><p className="text-sm font-semibold">No signature uploaded</p></div>}
              </div>
            </div>
          </section>
        )}
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

function PathologistDeskNav({ activeView, onChange, views }) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-4">
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
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Pathologist Workflow</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ReportsTable({ reports, section, onView }) {
  if (!reports.length) {
    return <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center text-sm font-bold text-slate-500">No reports in this section.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
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
            <tr key={report._id} className="border-t border-emerald-100 text-slate-600 transition-colors hover:bg-emerald-50/50">
              <td className="p-3 font-black text-emerald-800">{report.bookingId?.bookingCode || report.bookingId?._id || "N/A"}</td>
              <td className="p-3 font-black text-emerald-700">{report.reportId || "N/A"}</td>
              <td className="p-3 font-bold text-slate-800">{report.userId?.name || report.bookingId?.name || "N/A"}</td>
              <td className="p-3">{report.testName}</td>
              <td className="p-3">{section === "approved" ? formatDate(report.approvedAt) : report.technicianId?.name || "N/A"}</td>
              <td className="p-3">{section === "rejected" ? report.rejectionReason || "N/A" : formatDate(report.submittedAt || report.updatedAt)}</td>
              <td className="p-3 text-right">
                <button onClick={() => onView(report)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl shadow-emerald-950/15">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{report.bookingId?.bookingCode || report.bookingId?._id}</p>
            <h2 className="text-xl font-black text-emerald-950">{report.testName}</h2>
            <p className="text-sm font-black text-emerald-700">Report ID: {report.reportId || "N/A"}</p>
            <p className="text-sm text-slate-500">Patient: {report.userId?.name || report.bookingId?.name || "N/A"}</p>
          </div>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800">Close</button>
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

        <div className="overflow-x-auto rounded-2xl border border-emerald-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
              <tr>
                <th className="p-3">Parameter</th>
                <th className="p-3">Result</th>
                <th className="p-3">Normal Range</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((row, index) => (
                <tr key={index} className="border-t border-emerald-100">
                  <td className="p-3 font-bold text-slate-800">{row.parameter}</td>
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
          className="mt-2 min-h-24 w-full rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white"
        />

        {canReview && (
          <>
            <label className="mt-4 block text-sm font-bold text-slate-600">Reason for rejection</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Incorrect values entered"
              className="mt-2 min-h-20 w-full rounded-xl border border-red-100 bg-red-50/40 p-3 font-semibold outline-none focus:border-red-500 focus:bg-white"
            />
          </>
        )}

        {report.status === "Rejected" && <Detail label="Rejection Reason" value={report.rejectionReason || "N/A"} />}
        {report.status === "Approved" && (
          <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
            <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
              {report.pathologistSignatureImage && <img src={signatureSource(report.pathologistSignatureImage)} alt="Approving pathologist signature" className="mx-auto mb-2 max-h-20 max-w-48 object-contain" />}
              <p className="font-bold text-slate-900">{report.approvedPathologistName || report.approvedBy?.name || report.pathologistSignature || "Pathologist"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Approved: {formatDateTime(report.approvedAt)}</p>
            </div>
          </div>
        )}

        {canReview && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button onClick={() => onReject(report._id, { rejectionReason, pathologistRemarks })} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-700">
              <XCircle size={16} /> Reject Report
            </button>
            <button onClick={() => onApprove(report._id, pathologistRemarks)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800">
              <CheckCircle2 size={16} /> Approve Report
            </button>
          </div>
        )}
      </div>
    </div>
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
      : "bg-emerald-100 text-emerald-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
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
