import React, { useState } from "react";
import { forgotPassword, resetPassword, verifyResetOtp } from "../services/authService";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const [step, setStep] = useState("email");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: ""
  });

  const updateForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOtp = async (e) => {
    e.preventDefault();

    if (!emailPattern.test(form.email)) {
      alert("Please enter a valid email");
      return;
    }

    try {
      const data = await forgotPassword({ email: form.email });
      setMessage(data.devOtp ? `${data.message} Dev OTP: ${data.devOtp}` : data.message);
      setStep("otp");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to send OTP");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!form.otp) {
      alert("Please enter OTP");
      return;
    }

    try {
      const data = await verifyResetOtp({ email: form.email, otp: form.otp });
      setMessage(data.message);
      setStep("reset");
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const data = await resetPassword({ email: form.email, password: form.password });
      alert(data.message);
      window.location.href = "/login";
    } catch (error) {
      alert(error.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: "#1e3a8a", fontSize: "28px", fontWeight: "700", textAlign: "center", marginBottom: "8px" }}>
          Forgot Password
        </h2>
        <p style={{ color: "#475569", fontSize: "14px", textAlign: "center", marginBottom: "24px" }}>
          {step === "email" && "Enter your registered email"}
          {step === "otp" && "Verify the OTP sent to your email"}
          {step === "reset" && "Create your new password"}
        </p>

        {message && <p style={noticeStyle}>{message}</p>}

        {step === "email" && (
          <form onSubmit={sendOtp}>
            <Input name="email" type="email" placeholder="Registered email" value={form.email} onChange={updateForm} />
            <button style={buttonStyle}>Send OTP</button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp}>
            <Input name="otp" placeholder="Enter OTP" value={form.otp} onChange={updateForm} />
            <button style={buttonStyle}>Verify OTP</button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={savePassword}>
            <Input name="password" type="password" placeholder="New password" value={form.password} onChange={updateForm} />
            <Input name="confirmPassword" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={updateForm} />
            <button style={buttonStyle}>Reset Password</button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          <a href="/login" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>Back to Login</a>
        </div>
      </div>
    </div>
  );
}

function Input(props) {
  return <input {...props} style={inputStyle} />;
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
  padding: "clamp(24px, 6vw, 42px)",
  borderRadius: "16px",
  boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
  boxSizing: "border-box"
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: "16px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
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

const noticeStyle = {
  color: "#1e3a8a",
  background: "#ebf8ff",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "13px",
  marginBottom: "16px"
};

export default ForgotPassword;
