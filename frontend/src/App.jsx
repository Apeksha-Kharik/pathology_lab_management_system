import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import LoginPage from "./pages/loginPage";
import ForgotPassword from "./pages/ForgotPassword";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RoleDashboard from "./pages/RoleDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/patient_dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/receptionist" element={<ProtectedRoute allowedRoles={["receptionist"]}><RoleDashboard title="Receptionist Dashboard" /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute allowedRoles={["technician"]}><RoleDashboard title="Technician Dashboard" /></ProtectedRoute>} />
          <Route path="/pathologist" element={<ProtectedRoute allowedRoles={["pathologist"]}><RoleDashboard title="Pathologist Dashboard" /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
