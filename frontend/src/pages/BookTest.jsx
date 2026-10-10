import React, { useEffect, useState } from "react";
import { createBooking, getTests } from "../services/patientService";
import { bookingWhatsAppUrl } from "../services/bookingWhatsApp";

function BookTest() {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({
    testId: "",
    name: "",
    age: "",
    phone: "",
    email: "",
    bookingDate: "",
    timeSlot: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTests()
      .then(setTests)
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load tests."))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setWhatsAppUrl("");
    setSubmitting(true);

    try {
      const result = await createBooking(form);
      if (result.booking) setWhatsAppUrl(bookingWhatsAppUrl(result.booking));
      setMessage(`${result.message}${result.booking?.bookingCode ? ` Booking ID: ${result.booking.bookingCode}` : ""}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Booking request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Book a Test</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <select name="testId" value={form.testId} onChange={updateField} required disabled={loading || tests.length === 0} className="rounded-lg border p-3 sm:col-span-2">
          <option value="">{loading ? "Loading tests..." : "Select a test"}</option>
          {tests.map((test) => <option key={test._id} value={test._id}>{test.testName} - INR {test.price}</option>)}
        </select>
        <input name="name" value={form.name} onChange={updateField} placeholder="Patient name" required className="rounded-lg border p-3" />
        <input name="age" value={form.age} onChange={updateField} type="number" min="1" placeholder="Age" required className="rounded-lg border p-3" />
        <input name="phone" value={form.phone} onChange={updateField} type="tel" placeholder="Phone" required className="rounded-lg border p-3" />
        <input name="email" value={form.email} onChange={updateField} type="email" placeholder="Email" className="rounded-lg border p-3" />
        <input name="bookingDate" value={form.bookingDate} onChange={updateField} type="date" required className="rounded-lg border p-3" />
        <input name="timeSlot" value={form.timeSlot} onChange={updateField} placeholder="Preferred time slot" required className="rounded-lg border p-3" />
        {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-800 sm:col-span-2">{message}</p>}
        {whatsAppUrl && <div className="sm:col-span-2">
          <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-emerald-700 p-3 font-semibold text-white">Message lab on WhatsApp</a>
          <p className="mt-2 text-sm text-slate-600">Your booking details are filled in. Tap Send in WhatsApp to message the lab to get information about your booking.</p>
        </div>}
        <button type="submit" disabled={loading || tests.length === 0 || submitting} className="rounded-lg bg-emerald-700 p-3 font-semibold text-white disabled:opacity-50 sm:col-span-2">
          {submitting ? "Submitting..." : "Request Booking"}
        </button>
      </form>
    </section>
  );
}

export default BookTest;
