import React from 'react';
import logo from '../assets/logo.png'; 

const Navbar = () => {
  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 8%', 
      backgroundColor: '#fff', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* 2. New Logo Image Tag */}
        <img 
          src={logo} 
          alt="INDIPATH Logo" 
          style={{ 
            height: '65px',       // Adjusted height for better balance with text
            width: 'auto', 
            objectFit: 'contain' 
          }} 
        />
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.4rem',   // Slightly larger to match the new logo's presence
            color: '#1a365d', 
            letterSpacing: '1px', 
            fontWeight: '800' 
          }}>
            INDIPATH
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '0.75rem', 
            color: '#4a5568', 
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Super Speciality Lab
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '35px', alignItems: 'center', fontWeight: '500', color: '#4a5568' }}>
        <span style={{ cursor: 'pointer', transition: '0.3s' }}>Home</span>
        <span style={{ cursor: 'pointer' }}>Services</span>
        <span style={{ cursor: 'pointer' }}>About</span>
        <button style={{ 
          backgroundColor: '#2b6cb0', 
          color: 'white', 
          border: 'none', 
          padding: '10px 24px', 
          borderRadius: '6px', 
          fontWeight: '600', 
          cursor: 'pointer', 
          boxShadow: '0 4px 6px rgba(43, 108, 176, 0.2)' 
        }}>
          Login
        </button>
      </div>
    </nav>
  );
};

export default Navbar;