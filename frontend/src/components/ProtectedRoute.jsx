import React from "react";
import { Navigate } from "react-router-dom";
import { roleRoutes, useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleRoutes[user.role] || "/login"} />;
  }

  return children;
}

export default ProtectedRoute;
