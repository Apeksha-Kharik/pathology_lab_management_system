import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; 

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  // Adds a shadow and blur effect when you scroll down
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItemStyle = {
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#4a5568',
    transition: 'all 0.3s ease',
    position: 'relative',
    padding: '5px 0'
  };

  return (
    <nav style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  // Smoother height transition
  padding: scrolled ? '0.5rem 8%' : '1rem 8%', 
  backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.85)', 
  backdropFilter: 'blur(12px)', // Butter smooth glass effect
  boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.05)' : 'none', 
  position: 'sticky', 
  top: 0, 
  zIndex: 1000,
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' // The "Butter" line
}}>
      
      {/* Brand Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', cursor: 'pointer' }}>
        <img 
          src={logo} 
          alt="INDIPATH Logo" 
          style={{ 
            height: scrolled ? '60px' : '65px', 
            transition: 'all 0.4s ease',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))',
            borderRadius:50
          }} 
        />
        <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '18px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: scrolled ? '1.4rem' : '1.6rem', 
            color: '#1a365d', 
            letterSpacing: '1.5px', 
            fontWeight: '900',
            background: 'linear-gradient(90deg, #1a365d, #2b6cb0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transition: 'all 0.4s ease',
          }}>
            INDIPATH
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: scrolled ? '0.6rem' : '0.7rem', 
            color: '#718096', 
            textTransform: 'uppercase',
            fontWeight: '700',
            letterSpacing: '2px',
            transition: 'all 0.4s ease',
          }}>
            Super Speciality Lab
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' , fontSize: '1rem'}}>
        {['Home', 'Services', 'About'].map((item) => (
          <span 
            key={item}
            style={navItemStyle}
            onMouseEnter={(e) => {
              e.target.style.color = '#2b6cb0';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#4a5568';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {item}
          </span>
        ))}

        {/* Premium Login Button */}
        <button 
          style={{ 
            backgroundColor: '#1a365d', 
            color: 'white', 
            border: 'none', 
            padding: '12px 32px', 
            borderRadius: '50px', 
            fontWeight: '700', 
            fontSize: '0.8rem',
            cursor: 'pointer', 
            boxShadow: '0 8px 15px rgba(26, 54, 93, 0.2)',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2b6cb0';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 12px 20px rgba(43, 108, 176, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a365d';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 8px 15px rgba(26, 54, 93, 0.2)';
          }}
        >
          LOGIN
        </button>
      </div>
    </nav>
  );
};

export default Navbar;