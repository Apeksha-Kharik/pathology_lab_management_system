import React from 'react';

const StatsGrid = () => {
  const stats = [
    { label: 'Tests Conducted', val: '5000+', icon: '🧪', color: '#ebf8ff' },
    { label: 'Reports Generated', val: '12000+', icon: '📋', color: '#f0fff4' },
    { label: 'Happy Patients', val: '8000+', icon: '👥', color: '#fffaf0' },
    { label: 'Expert Pathologists', val: '50+', icon: '👨‍⚕️', color: '#fff5f5' }
  ];

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', padding: '0 8%', marginTop: '-60px' }}>
      {stats.map((stat, i) => (
        <div key={i} style={{ backgroundColor: 'white', padding: '35px 20px', borderRadius: '20px', boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)', textAlign: 'center', transition: 'transform 0.3s' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{stat.icon}</div>
          <h3 style={{ fontSize: '1.8rem', color: '#1a365d', margin: '0 0 8px 0', fontWeight: '800' }}>{stat.val}</h3>
          <p style={{ color: '#718096', fontSize: '1rem', fontWeight: '500', margin: 0 }}>{stat.label}</p>
        </div>
      ))}
    </section>
  );
};

export default StatsGrid;