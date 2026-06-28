import React from "react";
import { useAuth } from "../context/useAuth";

function RoleDashboard({ title }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        <p className="mt-3 text-slate-500">
          This role dashboard is ready for the next project phase.
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 rounded-md bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default RoleDashboard;
