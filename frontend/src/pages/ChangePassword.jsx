import React, { useState } from "react";
import { roleRoutes, useAuth } from "../context/AuthContext";
import { changePassword } from "../services/profileService";

function ChangePassword() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const submit = async (e) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      alert("All fields are required");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const data = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      alert(data.message);
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...savedUser, mustChangePassword: false }));
      window.location.href = roleRoutes[user?.role] || "/login";
    } catch (error) {
      alert(error.response?.data?.message || "Password change failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="mb-6 text-sm text-slate-500">Please replace your temporary password.</p>
        <input className="mb-4 w-full rounded-md border border-slate-200 p-3" type="password" placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <input className="mb-4 w-full rounded-md border border-slate-200 p-3" type="password" placeholder="New password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        <input className="mb-5 w-full rounded-md border border-slate-200 p-3" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <button className="w-full rounded-md bg-blue-600 p-3 font-bold text-white hover:bg-blue-700">Update Password</button>
      </form>
    </div>
  );
}

export default ChangePassword;
