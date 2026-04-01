import React from 'react';
import { motion } from 'framer-motion';
import { Microscope, FileCheck, Users2, ShieldCheck } from 'lucide-react';

const StatsGrid = () => {
  const stats = [
    { label: 'Tests Conducted', val: '5,000+', icon: <Microscope size={32} />, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
    { label: 'Reports Generated', val: '12,000+', icon: <FileCheck size={32} />, color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)' },
    { label: 'Happy Patients', val: '8,000+', icon: <Users2 size={32} />, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
    { label: 'Expert Pathologists', val: '50+', icon: <ShieldCheck size={32} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
  ];

  return (
    <section style={{ 
      padding: '0 5%', 
      marginTop: '-70px', 
      position: 'relative', 
      zIndex: 20 
    }}>
      <div style={{ 
        display: 'grid', 
        // STRICT 4-COLUMN LAYOUT
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -15 }}
            style={{
              backgroundColor: '#ffffff',
              padding: '45px 20px',
              borderRadius: '28px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(26, 54, 93, 0.08)',
              border: '1px solid #f1f5f9',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* ICON CONTAINER - VIBRANT CONTRAST */}
            <div style={{
              width: '75px',
              height: '75px',
              borderRadius: '20px',
              backgroundColor: stat.bg,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 25px auto',
              border: `1px solid ${stat.color}20` // Very faint border of the same icon color
            }}>
              {stat.icon}
            </div>

            <h3 style={{ 
              fontSize: '2.4rem', 
              fontWeight: '900', 
              color: '#1a365d', 
              margin: '0 0 8px 0',
              letterSpacing: '-1px'
            }}>
              {stat.val}
            </h3>

            <p style={{ 
              fontSize: '0.75rem', 
              fontWeight: '800', 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: '1.2px',
              lineHeight: '1.4'
            }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsGrid;