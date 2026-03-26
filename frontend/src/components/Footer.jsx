import React from 'react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1a202c', color: 'white', padding: '80px 8% 40px 8%', marginTop: '100px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff' }}>INDIPATH Lab</h3>
          <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
            22 Mahapurush Complex, Bazarpeth Kankavali<br/>
            Tal. Kankavali - 416 602, Maharashtra
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Contact Details</h3>
          <p style={{ color: '#a0aec0', marginBottom: '10px' }}>📞 02367-231970, 7448231970</p>
          <p style={{ color: '#a0aec0' }}>✉️ indipathlab@gmail.com</p>
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Quick Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#a0aec0' }}>
            <span style={{ cursor: 'pointer' }}>Patient Portal</span>
            <span style={{ cursor: 'pointer' }}>Check Report Status</span>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #2d3748', marginTop: '60px', paddingTop: '30px', textAlign: 'center' }}>
        <p style={{ color: '#718096', margin: 0 }}>© 2026 INDIPATH Multidiagnostic LLP. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;