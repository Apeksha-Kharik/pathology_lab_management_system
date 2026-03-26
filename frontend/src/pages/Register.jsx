import React, { useState } from "react";

function RegisterPage() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    address: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ Check empty fields
  if (
    !formData.name ||
    !formData.email ||
    !formData.password ||
    !formData.mobile ||
    !formData.address
  ) {
    alert("All fields are required ❌");
    return;
  }

  // ✅ Email format check (better regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(formData.email)) {
    alert("Enter valid email format ❌");
    return;
  }

  // ✅ Mobile validation (10 digits)
  if (formData.mobile.length !== 10) {
    alert("Enter valid 10-digit mobile number ❌");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    alert(data.message);

  } catch (error) {
    alert("Server error ❌");
  }
};
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">

      <div className="backdrop-blur-lg bg-white/20 p-10 rounded-3xl shadow-2xl w-[380px] border border-white/30">
        
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Pathology Lab 🧪
        </h2>

        <p className="text-center text-white/80 mb-6">
          Create your account
        </p>

        <form onSubmit={handleSubmit}>

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full p-3 mb-4 rounded-lg bg-white/80"
          />

          <input
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
            className="w-full p-3 mb-4 rounded-lg bg-white/80"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-3 mb-4 rounded-lg bg-white/80"
          />

          <input
            name="mobile"
            placeholder="Mobile Number"
            onChange={handleChange}
            className="w-full p-3 mb-4 rounded-lg bg-white/80"
          />

          <input
            name="address"
            placeholder="Address"
            onChange={handleChange}
            className="w-full p-3 mb-6 rounded-lg bg-white/80"
          />

          <button
            type="submit"
            className="w-full bg-white text-purple-600 font-semibold p-3 rounded-lg hover:bg-gray-100"
          >
            Register
          </button>

        </form>
      </div>
    </div>
  );
}

export default RegisterPage;