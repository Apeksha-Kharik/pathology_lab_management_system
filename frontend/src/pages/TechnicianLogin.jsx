import React, { useState } from "react";
import { loginTechnician } from "../services/authService";

function TechnicianLogin() {
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Email and password are required");
      return;
    }

    try {
      const data = await loginTechnician(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user.id);
      window.location.href = data.user.mustChangePassword ? "/change-password" : "/technician/dashboard";
    } catch (error) {
      alert(error.response?.data?.message || "Technician login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Technician Login</h1>
        <p className="mb-6 text-sm text-slate-500">Login with your assigned lab staff account.</p>
        <input className="mb-4 w-full rounded-md border border-slate-200 p-3" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="mb-5 w-full rounded-md border border-slate-200 p-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded-md bg-blue-600 p-3 font-bold text-white hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
}

export default TechnicianLogin;
