import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { roleRoutes, useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const user = await login(formData);
      navigate(roleRoutes[user.role] || "/patient_dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Server error");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: "#1e3a8a", fontSize: "30px", fontWeight: "700", marginBottom: "8px" }}>
            Welcome Back
          </h2>
          <p style={{ color: "#475569", fontSize: "14px" }}>
            Login to INDIPATH Super Speciality Lab
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
          />

          <div style={{ position: "relative", marginBottom: "10px" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{ ...inputStyle, paddingRight: "48px", marginBottom: 0 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={iconButtonStyle}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <a href="/forgot-password" style={{ color: "#2563eb", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" style={buttonStyle}>Login</button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
          Don't have an account?{" "}
          <a href="/register" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>
            Register
          </a>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
  fontFamily: "Poppins, sans-serif",
  padding: "24px"
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "rgba(255,255,255,0.95)",
  padding: "45px",
  borderRadius: "16px",
  boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
  backdropFilter: "blur(10px)"
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "18px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
};

const iconButtonStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "pointer",
  padding: "6px"
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "linear-gradient(90deg, #2563eb, #1e3a8a)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer"
};

export default LoginPage;
