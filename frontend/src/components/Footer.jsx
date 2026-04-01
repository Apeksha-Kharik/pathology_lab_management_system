import React from 'react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#071830', color: 'white', padding: '80px 8% 40px 8%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '15px' }}>INDIPATH</h2>
          <p style={{ color: '#cbd5e0', lineHeight: '1.6', fontSize: '0.9rem' }}>
            Precision diagnostics powered by advanced technology and expert care. Your health, our priority.
          </p>
        </div>
        
        <div>
          <h4 style={{ color: '#63b3ed', marginBottom: '20px', fontSize: '1rem', textTransform: 'uppercase' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, color: '#cbd5e0', lineHeight: '2.5', fontSize: '0.9rem' }}>
            <li>Home</li>
            <li>Book a Test</li>
            <li>Download Report</li>
            <li>Our Centers</li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#63b3ed', marginBottom: '20px', fontSize: '1rem', textTransform: 'uppercase' }}>Contact Us</h4>
          <p style={{ color: '#cbd5e0', fontSize: '0.9rem' }}>📍 Kankavali, Maharashtra - 416 602</p>
          <p style={{ color: '#cbd5e0', fontSize: '0.9rem' }}>📞 +91 7448231970</p>
          <p style={{ color: '#cbd5e0', fontSize: '0.9rem' }}>✉️ info@indipathlab.com</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '60px', paddingTop: '30px', textAlign: 'center', color: '#a0aec0', fontSize: '0.8rem' }}>
        © 2026 INDIPATH Multidiagnostic LLP. Designed for Excellence.
      </div>
    </footer>
  );
};

export default Footer;