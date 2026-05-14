import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { approveReport, getPendingReports } from "../services/pathologistService";

function PathologistDashboard() {
  const { logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [signature, setSignature] = useState("");

  const loadReports = async () => {
    setReports(await getPendingReports());
  };

  useEffect(() => {
    loadReports().catch(() => alert("Unable to load reports"));
  }, []);

  const handleApprove = async (reportId) => {
    if (!signature) {
      alert("Enter pathologist signature");
      return;
    }

    try {
      const data = await approveReport(reportId, signature);
      alert(data.message);
      await loadReports();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Pathologist Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-sm font-bold text-slate-600">Pathologist Signature</label>
          <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Dr. Name" className="w-full rounded-md border border-slate-200 p-3" />
        </div>

        <section className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase text-slate-400">{report.bookingId?.bookingCode}</p>
              <h2 className="text-lg font-bold">{report.testName}</h2>
              <p className="text-sm text-slate-500">Patient: {report.userId?.name}</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="p-2">Parameter</th><th className="p-2">Value</th><th className="p-2">Reference</th></tr>
                  </thead>
                  <tbody>
                    {report.results.map((row, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="p-2">{row.parameter}</td>
                        <td className="p-2">{row.value} {row.unit}</td>
                        <td className="p-2">{row.referenceRange || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-slate-600">Technician remarks: {report.technicianRemarks || "N/A"}</p>
              <button onClick={() => handleApprove(report._id)} className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white">Approve Report</button>
            </div>
          ))}
          {!reports.length && <p className="rounded-md bg-white p-6 text-center text-slate-500">No reports pending review.</p>}
        </section>
      </main>
    </div>
  );
}

export default PathologistDashboard;
