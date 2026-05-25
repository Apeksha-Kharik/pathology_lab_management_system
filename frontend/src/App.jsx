import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import LoginPage from "./pages/loginPage";
import ReceptionistLogin from "./pages/ReceptionistLogin";
import TechnicianLogin from "./pages/TechnicianLogin";
import PathologistLogin from "./pages/PathologistLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import PathologistDashboard from "./pages/PathologistDashboard";
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
          <Route path="/receptionist/login" element={<ReceptionistLogin />} />
          <Route path="/technician/login" element={<TechnicianLogin />} />
          <Route path="/pathologist/login" element={<PathologistLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ProtectedRoute allowedRoles={["admin", "patient", "receptionist", "technician", "pathologist"]}><ChangePassword /></ProtectedRoute>} />

          <Route path="/patient_dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/receptionist" element={<ProtectedRoute allowedRoles={["receptionist"]}><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/dashboard" element={<ProtectedRoute allowedRoles={["receptionist"]}><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} />
          <Route path="/technician/dashboard" element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} />
          <Route path="/pathologist" element={<ProtectedRoute allowedRoles={["pathologist"]}><PathologistDashboard /></ProtectedRoute>} />
          <Route path="/pathologist/dashboard" element={<ProtectedRoute allowedRoles={["pathologist"]}><PathologistDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
