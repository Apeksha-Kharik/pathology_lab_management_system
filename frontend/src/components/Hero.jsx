import React from 'react';

const Hero = () => {
  return (
    <header style={{ padding: '100px 8%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)', minHeight: '60vh' }}>
      <div style={{ maxWidth: '650px' }}>
        <div style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', display: 'inline-block', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '20px' }}>
          TRUSTED BY 8000+ PATIENTS
        </div>
        <h2 style={{ fontSize: '3.5rem', color: '#1a365d', lineHeight: '1.1', marginBottom: '25px', fontWeight: '800' }}>
          Fast, Accurate <br/><span style={{ color: '#3182ce' }}>Results You Can Trust.</span>
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#718096', marginBottom: '40px', lineHeight: '1.6' }}>
          India's Leading Pathology Laboratory with State-of-the-Art Technology and Expert Pathologists dedicated to your health.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button style={{ padding: '16px 35px', backgroundColor: '#2c5282', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: '0.3s' }}>Book a Test</button>
          <button style={{ padding: '16px 35px', border: '2px solid #2c5282', color: '#2c5282', background: 'transparent', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer' }}>View Reports</button>
        </div>
      </div>
      <div style={{ fontSize: '180px', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.1))' }}>🧪</div>
    </header>
  );
};

export default Hero;