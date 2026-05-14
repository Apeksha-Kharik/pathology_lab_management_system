import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getTechnicianBookings,
  submitTechnicianReport,
  updateTechnicianStatus
} from "../services/technicianService";

function TechnicianDashboard() {
  const { logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);

  const loadBookings = async () => {
    setBookings(await getTechnicianBookings());
  };

  useEffect(() => {
    loadBookings().catch(() => alert("Unable to load technician bookings"));
  }, []);

  const handleStatus = async (bookingId, status) => {
    try {
      const data = await updateTechnicianStatus(bookingId, status);
      alert(data.message);
      await loadBookings();
    } catch (error) {
      alert(error.response?.data?.message || "Status update failed");
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
          <h1 className="text-2xl font-bold">Technician Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Sample Collection & Processing</h2>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="rounded-md border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">{booking.bookingCode}</p>
                <h3 className="font-bold">{booking.testName}</h3>
                <p className="text-sm text-slate-500">Patient: {booking.name}</p>
                <p className="text-sm text-slate-500">Status: {booking.bookingStatus}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => handleStatus(booking._id, "Sample Collected")} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white">Sample Collected</button>
                  <button onClick={() => handleStatus(booking._id, "Processing")} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold text-white">Processing</button>
                  <button onClick={() => setActiveBooking(booking)} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-bold text-white">Enter Report</button>
                </div>
              </div>
            ))}
            {!bookings.length && <p className="rounded-md bg-slate-50 p-6 text-center text-slate-500">No confirmed bookings yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Test Results</h2>
          {activeBooking ? <ReportForm booking={activeBooking} onDone={() => { setActiveBooking(null); loadBookings(); }} /> : <p className="text-slate-500">Select a booking to enter results.</p>}
        </section>
      </main>
    </div>
  );
}

function ReportForm({ booking, onDone }) {
  const [technicianRemarks, setTechnicianRemarks] = useState("");
  const [results, setResults] = useState([
    { parameter: "", value: "", unit: "", referenceRange: "" }
  ]);

  const updateResult = (index, field, value) => {
    setResults(results.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setResults([...results, { parameter: "", value: "", unit: "", referenceRange: "" }]);
  };

  const submit = async (e) => {
    e.preventDefault();
    const cleanResults = results.filter((row) => row.parameter && row.value);

    if (!cleanResults.length) {
      alert("Enter at least one result");
      return;
    }

    try {
      const data = await submitTechnicianReport(booking._id, { results: cleanResults, technicianRemarks });
      alert(data.message);
      onDone();
    } catch (error) {
      alert(error.response?.data?.message || "Report submission failed");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-md bg-blue-50 p-3 text-sm font-semibold text-blue-900">{booking.testName}</div>
      {results.map((row, index) => (
        <div key={index} className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 p-3">
          <Input placeholder="Parameter" value={row.parameter} onChange={(e) => updateResult(index, "parameter", e.target.value)} />
          <Input placeholder="Value" value={row.value} onChange={(e) => updateResult(index, "value", e.target.value)} />
          <Input placeholder="Unit" value={row.unit} onChange={(e) => updateResult(index, "unit", e.target.value)} />
          <Input placeholder="Reference range" value={row.referenceRange} onChange={(e) => updateResult(index, "referenceRange", e.target.value)} />
        </div>
      ))}
      <button type="button" onClick={addRow} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">Add Result Row</button>
      <textarea value={technicianRemarks} onChange={(e) => setTechnicianRemarks(e.target.value)} placeholder="Technician remarks" className="min-h-24 w-full rounded-md border border-slate-200 p-3" />
      <button className="w-full rounded-md bg-blue-600 p-3 font-bold text-white">Submit for Review</button>
    </form>
  );
}

function Input(props) {
  return <input {...props} className="rounded-md border border-slate-200 p-2 outline-none focus:border-blue-500" />;
}

export default TechnicianDashboard;
