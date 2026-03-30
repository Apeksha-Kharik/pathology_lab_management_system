import React, { useState } from "react";

function BookTest() {

  const [form, setForm] = useState({
    name: "",
    testName: "",
    age: "",
    phone: "",
    email: "",
    date: "",
    homeSample: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/book-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        userId: localStorage.getItem("userId")
      })
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Book Test 🧪</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

        <input placeholder="Name" className="p-3 rounded-lg bg-white/80 text-black"
          onChange={e => setForm({...form,name:e.target.value})} />

        <input placeholder="Test Name" className="p-3 rounded-lg bg-white/80 text-black"
          onChange={e => setForm({...form,testName:e.target.value})} />

        <input placeholder="Age" className="p-3 rounded-lg bg-white/80 text-black"
          onChange={e => setForm({...form,age:e.target.value})} />

        <input placeholder="Phone" className="p-3 rounded-lg bg-white/80 text-black"
          onChange={e => setForm({...form,phone:e.target.value})} />

        <input placeholder="Email" className="p-3 rounded-lg bg-white/80 text-black"
          onChange={e => setForm({...form,email:e.target.value})} />

        <input type="date" className="p-3 rounded-lg bg-white/80 text-black"
          onChange={e => setForm({...form,date:e.target.value})} />

        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox"
            onChange={e => setForm({...form,homeSample:e.target.checked})} />
          Request Home Sample
        </div>

        <button className="col-span-2 bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg">
          Book Now
        </button>

      </form>
    </div>
  );
}

export default BookTest;