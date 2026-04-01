import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    if (user.role === "Admin") {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/patient_dashboard" />;
    }
  }

  return children;
}

export default ProtectedRoute;