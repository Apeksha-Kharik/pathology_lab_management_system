import React, { useState, useEffect } from "react";
import axios from "axios";

function PatientDashboard() {
  const [active, setActive] = useState("book");
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState(null); // Track test selection

  // Fetch tests from your backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/tests');
        setTests(res.data || []);
      } catch (err) {
        console.error("Error fetching tests", err);
      }
    };
    fetchTests();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  // Filter tests based on search input
  const filteredTests = tests.filter(test => 
    test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E0ECFF] via-[#F8FAFF] to-[#EEF2FF] overflow-x-hidden">

      {/* 🌊 BACKGROUND GLOW */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-300 opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-100px] w-[350px] h-[350px] bg-indigo-300 opacity-30 rounded-full blur-3xl"></div>

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-5 bg-white/70 backdrop-blur-xl shadow-md border-b border-white/40 relative z-50 sticky top-0">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">🧪 IndiPath</h1>
        <div className="flex gap-8 items-center font-medium">
          <NavBtn text="Book" setActive={(val) => { setActive(val); setSelectedTest(null); }} />
          <NavBtn text="History" setActive={setActive} />
          <NavBtn text="Reports" setActive={setActive} />
          <button onClick={handleLogout} className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white px-6 py-2 rounded-full shadow-md hover:scale-105 transition">
            Logout
          </button>
        </div>
      </div>

      {/* SEARCH BAR (Only visible in 'book' view when no test is selected) */}
      {active === "book" && !selectedTest && (
        <div className="px-10 pt-10 relative z-10 max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="🔍 Search for tests (e.g. CBC, Blood, Glucose)..." 
            className="w-full p-4 rounded-2xl border-2 border-white bg-white/80 backdrop-blur-md shadow-lg outline-none focus:border-blue-400 transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* HEADER */}
      <div className="px-10 py-8 relative z-10">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
          {selectedTest ? `Booking ${selectedTest.testName}` : "Welcome back 👋"}
        </h2>
        <p className="text-gray-500 text-lg">
          {selectedTest ? "Please fill in the details below to confirm" : "Manage your health journey easily"}
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-10 pb-20 relative z-10">
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40">
          
          {active === "book" && (
            selectedTest ? (
              // SHOW FORM IF TEST SELECTED
              <div>
                <button onClick={() => setSelectedTest(null)} className="mb-4 text-blue-600 font-bold hover:underline">← Back to available tests</button>
                <BookTest prefilledTest={selectedTest.testName} onComplete={() => { setSelectedTest(null); setActive("history"); }} />
              </div>
            ) : (
              // SHOW CARDS IF NO TEST SELECTED
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <div key={test._id} className="bg-white p-6 rounded-2xl border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{test.category}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#1E3A8A]">{test.testName}</h3>
                      <p className="text-gray-500 text-sm mt-2 mb-4 line-clamp-2">{test.description || "Full diagnostic lab report."}</p>
                      <div className="flex justify-between items-center border-t pt-4">
                        <span className="text-2xl font-black text-gray-800">₹{test.price}</span>
                        <button 
                          onClick={() => setSelectedTest(test)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center py-10 text-gray-400">No tests matching your search.</p>
                )}
              </div>
            )
          )}

          {active === "history" && <History />}
          {active === "reports" && <Reports />}

        </div>
      </div>
    </div>
  );
}

/* NAV BUTTON */
function NavBtn({ text, setActive }) {
  return (
    <button
      onClick={() => setActive(text.toLowerCase())}
      className="text-gray-600 hover:text-blue-600 transition hover:scale-105"
    >
      {text}
    </button>
  );
}

/* BOOK TEST COMPONENT */
function BookTest({ prefilledTest, onComplete }) {
  const [form, setForm] = useState({
    name: "", testName: prefilledTest || "", age: "", phone: "", email: "", date: "", homeSample: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.phone || !form.date) {
      alert("Please fill all required fields ❌");
      return;
    }

    let history = JSON.parse(localStorage.getItem("history")) || [];
    history.push({ ...form, status: "Pending" });
    localStorage.setItem("history", JSON.stringify(history));

    alert("Test Booked Successfully ✅");
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
      <div className="col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <label className="text-xs font-bold text-blue-400 uppercase">Selected Test</label>
        <p className="text-lg font-bold text-blue-900">{form.testName}</p>
      </div>

      <Input name="name" placeholder="Patient Full Name" value={form.name} onChange={handleChange} />
      <Input name="age" placeholder="Age" type="number" value={form.age} onChange={handleChange} />
      <Input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
      <Input name="email" placeholder="Email (Optional)" value={form.email} onChange={handleChange} />
      <Input type="date" name="date" value={form.date} onChange={handleChange} className="col-span-2 p-3 rounded-xl border border-gray-300" />

      <label className="col-span-2 flex gap-2 text-gray-600 items-center bg-white/50 p-3 rounded-xl">
        <input type="checkbox" name="homeSample" checked={form.homeSample} onChange={handleChange} className="w-5 h-5" />
        Request Home Sample Collection
      </label>

      <button className="col-span-2 bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-white p-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 font-bold text-lg">
        Confirm Appointment
      </button>
    </form>
  );
}

/* INPUT COMPONENT */
function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={`p-3 rounded-xl border border-gray-300 bg-white/80 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm transition ${className}`}
    />
  );
}

/* HISTORY */
function History() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E3A8A] mb-5">Your Booking History</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">No previous bookings found.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item, i) => (
            <div key={i} className="p-4 bg-white/80 rounded-2xl border shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">{item.testName}</p>
                <p className="text-sm text-gray-500">Scheduled: {item.date}</p>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Confirmed</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* REPORTS */
function Reports() {
  return (
    <div className="text-center py-10">
      <h2 className="text-xl font-bold text-[#1E3A8A] mb-5">Medical Reports</h2>
      <p className="text-gray-500 italic text-lg">No reports generated yet 📄</p>
      <p className="text-sm text-gray-400 mt-2">Reports will appear here once the lab results are ready.</p>
    </div>
  );
}

export default PatientDashboard;