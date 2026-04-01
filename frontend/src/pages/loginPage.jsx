import React, { useState } from "react";

function LoginPage() {
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
      alert("Please fill all fields ❌");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      alert(data.message);

      if (res.status === 200) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "Admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/patient_dashboard";
        }
      }

    } catch {
      alert("Server error ❌");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
      fontFamily: "Poppins, sans-serif"
    }}>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(255,255,255,0.95)",
        padding: "45px",
        borderRadius: "16px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
        backdropFilter: "blur(10px)"
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{
            color: "#1e3a8a",
            fontSize: "30px",
            fontWeight: "700",
            marginBottom: "8px"
          }}>
            Welcome Back 👋
          </h2>

          <p style={{ color: "#475569", fontSize: "14px" }}>
            Login to INDIPATH Super Speciality Lab
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                transition: "0.3s"
              }}
              onFocus={(e) => e.target.style.border = "1px solid #1e3a8a"}
              onBlur={(e) => e.target.style.border = "1px solid #cbd5e1"}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "22px" }}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                transition: "0.3s"
              }}
              onFocus={(e) => e.target.style.border = "1px solid #1e3a8a"}
              onBlur={(e) => e.target.style.border = "1px solid #cbd5e1"}
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(90deg, #2563eb, #1e3a8a)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "0.3s"
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.opacity = "0.9")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.opacity = "1")
            }
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "13px",
          color: "#64748b"
        }}>
          Don’t have an account?{" "}
          <a href="/register" style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: "600"
          }}>
            Register
          </a>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;