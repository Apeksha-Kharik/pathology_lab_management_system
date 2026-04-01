import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. CRITICAL IMPORT
import logo from '../assets/logo.png';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate(); // 2. INITIALIZE NAVIGATE

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItemStyle = {
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#4a5568',
    transition: 'all 0.3s ease',
    padding: '5px 0'
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: scrolled ? '0.5rem 8%' : '1rem 8%', 
      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
      backdropFilter: 'blur(12px)',
      boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.05)' : 'none', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <img src={logo} alt="Logo" style={{ height: scrolled ? '50px' : '60px', transition: '0.4s', borderRadius: '50%' }} />
        <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '18px' }}>
          <h1 style={{ margin: 0, fontSize: scrolled ? '1.3rem' : '1.5rem', fontWeight: '900', color: '#1a365d' }}>INDIPATH</h1>
          <p style={{ margin: 0, fontSize: '0.6rem', color: '#718096', fontWeight: '700', letterSpacing: '2px' }}>SUPER SPECIALITY LAB</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
        {['Home', 'Services', 'About'].map((item) => (
          <span key={item} style={navItemStyle} 
            onMouseEnter={(e) => e.currentTarget.style.color = '#2b6cb0'} 
            onMouseLeave={(e) => e.currentTarget.style.color = '#4a5568'}>
            {item}
          </span>
        ))}

        <button 
          onClick={() => navigate('/login')} // 3. WORKS NOW
          style={{ 
            backgroundColor: '#1a365d', color: 'white', border: 'none', padding: '12px 30px', 
            borderRadius: '50px', fontWeight: '700', cursor: 'pointer', transition: '0.3s' 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2b6cb0';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a365d';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          LOGIN
        </button>
      </div>
    </nav>
  );
};

export default Navbar;