import React, { useState } from "react";

function PatientDashboard() {
  const [active, setActive] = useState("book");

  const handleLogout = () => {
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E0ECFF] via-[#F8FAFF] to-[#EEF2FF] overflow-hidden">

      {/* 🌊 BACKGROUND GLOW */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-300 opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-100px] w-[350px] h-[350px] bg-indigo-300 opacity-30 rounded-full blur-3xl"></div>

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-5 
      bg-white/70 backdrop-blur-xl shadow-md border-b border-white/40 relative z-10">

        <h1 className="text-2xl font-bold text-[#1E3A8A]">
          🧪 IndiPath
        </h1>

        <div className="flex gap-8 items-center font-medium">
          <NavBtn text="Book" setActive={setActive} />
          <NavBtn text="History" setActive={setActive} />
          <NavBtn text="Reports" setActive={setActive} />

          <button onClick={handleLogout}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] 
            text-white px-6 py-2 rounded-full shadow-md 
            hover:scale-105 hover:shadow-lg transition">
            Logout
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="px-10 py-10 relative z-10">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
          Welcome back 👋
        </h2>
        <p className="text-gray-500 text-lg">
          Manage your tests, reports and bookings easily
        </p>
      </div>

      {/* CARDS */}
      <div className="px-10 grid grid-cols-3 gap-8 relative z-10">

        <Card title="Book Test" desc="Schedule new lab test" onClick={() => setActive("book")} />
        <Card title="History" desc="View past bookings" onClick={() => setActive("history")} />
        <Card title="Reports" desc="Check your reports" onClick={() => setActive("reports")} />

      </div>

      {/* MAIN CONTENT */}
      <div className="px-10 py-10 relative z-10">
        <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-xl border border-white/40">

          {active === "book" && <BookTest />}
          {active === "history" && <History />}
          {active === "reports" && <Reports />}

        </div>
      </div>

    </div>
  );
}

export default PatientDashboard;


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


/* CARD */
function Card({ title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/40
      shadow-md hover:shadow-2xl hover:-translate-y-2 transition duration-300 cursor-pointer
      hover:bg-gradient-to-br hover:from-white hover:to-blue-50"
    >
      <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
        {title}
      </h3>
      <p className="text-gray-500">{desc}</p>
    </div>
  );
}


/* INPUT */
function Input(props) {
  return (
    <input
      {...props}
      className="p-3 rounded-xl border border-gray-300 bg-white/80
      focus:ring-2 focus:ring-blue-400 outline-none shadow-sm focus:shadow-md transition"
    />
  );
}


/* BOOK TEST */
function BookTest() {
  const [form, setForm] = useState({
    name: "", testName: "", age: "", phone: "", email: "", date: "", homeSample: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.testName || !form.age || !form.phone || !form.email || !form.date) {
      alert("Please fill all fields ❌");
      return;
    }

    let history = JSON.parse(localStorage.getItem("history")) || [];
    history.push(form);
    localStorage.setItem("history", JSON.stringify(history));

    alert("Test Booked Successfully ✅");

    setForm({
      name: "", testName: "", age: "", phone: "", email: "", date: "", homeSample: false
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E3A8A] mb-5">Book Test</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">

        <Input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <Input name="testName" placeholder="Test Name" value={form.testName} onChange={handleChange} />
        <Input name="age" placeholder="Age" value={form.age} onChange={handleChange} />
        <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <Input type="date" name="date" value={form.date} onChange={handleChange} />

        <label className="col-span-2 flex gap-2 text-gray-600">
          <input type="checkbox" name="homeSample" checked={form.homeSample} onChange={handleChange} />
          Home Sample Collection
        </label>

        <button className="col-span-2 bg-gradient-to-r from-[#2563EB] to-[#1E3A8A]
        text-white p-3 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300">
          Book Now
        </button>

      </form>
    </div>
  );
}


/* HISTORY */
function History() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E3A8A] mb-5">History</h2>

      {history.length === 0 ? (
        <p className="text-gray-500">No data</p>
      ) : (
        history.map((item, i) => (
          <div key={i}
            className="p-4 mb-3 bg-white/60 backdrop-blur-md rounded-xl border shadow-sm">
            <p><b>{item.name}</b> - {item.testName}</p>
            <p className="text-sm text-gray-500">{item.date}</p>
          </div>
        ))
      )}
    </div>
  );
}


/* REPORTS */
function Reports() {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1E3A8A] mb-5">Reports</h2>
      <p className="text-gray-500">No reports yet 📄</p>
    </div>
  );
}