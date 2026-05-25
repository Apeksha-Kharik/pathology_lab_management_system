import React, { useState } from "react";
import { registerUser, verifyOtp } from "../services/authService";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const [step, setStep] = useState("register");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      return "Please fill all fields";
    }

    if (!emailPattern.test(formData.email)) {
      return "Please enter a valid email";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();

    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      const data = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      setMessage(data.devOtp ? `${data.message} Dev OTP: ${data.devOtp}` : data.message);
      setStep("otp");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    try {
      const data = await verifyOtp({ email: formData.email, otp });
      alert(data.message);
      window.location.href = "/login";
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      padding: "24px"
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "clamp(24px, 6vw, 42px)",
        borderRadius: "15px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        width: "100%",
        maxWidth: "460px",
        boxSizing: "border-box"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ color: "#1a365d", fontSize: "28px", fontWeight: "700", margin: "0 0 10px 0" }}>
            Patient Registration
          </h2>
          <p style={{ color: "#4a5568", fontSize: "15px", margin: 0 }}>
            {step === "register" ? "Create your INDIPATH account" : "Verify your email OTP"}
          </p>
        </div>

        {message && (
          <p style={{ color: "#1a365d", background: "#ebf8ff", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
            {message}
          </p>
        )}

        {step === "register" ? (
          <form onSubmit={handleSubmit}>
            <Input name="name" placeholder="Full name" value={formData.name} onChange={handleChange} />
            <Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
            <Input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
            <Input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
            <Input name="confirmPassword" type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} />

            <button type="submit" style={buttonStyle}>Register</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <Input name="otp" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button type="submit" style={buttonStyle}>Verify OTP</button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#718096" }}>
          Already have an account? <a href="/login" style={{ color: "#2b6cb0", textDecoration: "none", fontWeight: "500" }}>Login</a>
        </div>
      </div>
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "14px 16px",
        marginBottom: "16px",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        boxSizing: "border-box",
        fontSize: "14px",
        color: "#2d3748"
      }}
    />
  );
}

const buttonStyle = {
  width: "100%",
  padding: "14px 0",
  backgroundColor: "#2b6cb0",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer"
};

export default RegisterPage;
