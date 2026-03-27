import React, { useState } from "react";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", mobile: "", address: ""
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#1a365d', margin: '0', fontSize: '24px' }}>Patient Registration</h2>
          <p style={{ color: '#718096', fontSize: '14px' }}>Join INDIPATH Super Speciality Lab</p>
        </div>

        <form onSubmit={handleSubmit}>
          {['name', 'email', 'password', 'mobile', 'address'].map((field) => (
            <input
              key={field}
              name={field}
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
            />
          ))}

          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;