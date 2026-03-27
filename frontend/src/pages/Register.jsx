import React, { useState } from "react";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    address: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.mobile || !formData.address) {
      alert("Please fill all fields ❌");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      alert(data.message);
      if (res.status === 201) window.location.href = "/login"; // Redirect after success

    } catch (error) {
      alert("Cannot connect to server. Is your backend running? ❌");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)', // Dark blue gradient like website
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '50px',
        borderRadius: '15px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#1a365d', fontSize: '28px', fontWeight: '700', margin: '0 0 10px 0' }}>
            User Registration
          </h2>
          <p style={{ color: '#4a5568', fontSize: '15px', margin: 0 }}>
            Join INDIPATH Super Speciality Lab
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {['name', 'email', 'password', 'mobile', 'address'].map((field) => (
            <input
              key={field}
              name={field}
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e0',
                boxSizing: 'border-box',
                fontSize: '14px',
                color: '#2d3748'
              }}
            />
          ))}

          <button type="submit" style={{
            width: '100%',
            padding: '14px 0',
            backgroundColor: '#2b6cb0',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1a365d'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2b6cb0'}
          >
            Create Account
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#718096' }}>
          Already have an account? <a href="/login" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: '500' }}>Login</a>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;