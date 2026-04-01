import React from 'react';
import { motion } from 'framer-motion';
import { Home, Dna, Activity, ArrowRight, Zap, Microscope } from 'lucide-react';

const Services = () => {
  const services = [
    {
      title: "Home Sample Collection",
      desc: "NABL-certified phlebotomists at your doorstep for maximum safety and comfort.",
      icon: <Home size={32} />,
      tag: "ESSENTIAL",
      accent: "#2dd4bf" // Aqua
    },
    {
      title: "Genetic Testing",
      desc: "Deep-dive DNA analysis to identify hereditary risks and personalized health data.",
      icon: <Dna size={32} />,
      tag: "ADVANCED",
      accent: "#6366f1" // Indigo
    },
    {
      title: "Full Body Checkup",
      desc: "Comprehensive diagnostic screening covering 70+ essential health parameters.",
      icon: <Activity size={32} />,
      tag: "POPULAR",
      accent: "#f59e0b" // Amber
    }
  ];

  return (
    <section style={{ 
      padding: '120px 8%', 
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      {/* Background Decorative Element */}
      <div style={{ 
        position: 'absolute', top: '50px', left: '5%', opacity: 0.05, color: '#1a365d' 
      }}>
        <Microscope size={300} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
        <motion.span 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          style={{ 
            color: '#2dd4bf', 
            fontWeight: '800', 
            letterSpacing: '3px', 
            fontSize: '0.9rem',
            textTransform: 'uppercase'
          }}
        >
          ~ Laboratory Services ~
        </motion.span>
        <h2 style={{ 
          fontSize: '3.2rem', 
          color: '#1a365d', 
          fontWeight: '900', 
          marginTop: '15px',
          letterSpacing: '-1px'
        }}>
          Reliable & High-Quality <br />
          <span style={{ color: '#60a5fa' }}>Diagnostic Solutions</span>
        </h2>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '30px' 
      }}>
        {services.map((service, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -15 }}
            style={{
              padding: '60px 45px',
              borderRadius: '40px',
              backgroundColor: '#94aecf',
              border: '1px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.4s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a365d';
              e.currentTarget.style.color = 'white';
              e.currentTarget.querySelector('.icon-box').style.backgroundColor = service.accent;
              e.currentTarget.querySelector('.icon-box').style.color = 'white';
              e.currentTarget.querySelector('.serv-desc').style.color = '#cbd5e0';
              e.currentTarget.querySelector('.serv-btn').style.color = service.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = 'initial';
              e.currentTarget.querySelector('.icon-box').style.backgroundColor = 'white';
              e.currentTarget.querySelector('.icon-box').style.color = service.accent;
              e.currentTarget.querySelector('.serv-desc').style.color = '#64748b';
              e.currentTarget.querySelector('.serv-btn').style.color = '#1a365d';
            }}
          >
            {/* Tag */}
            <div style={{ 
              fontSize: '0.65rem', 
              fontWeight: '900', 
              color: service.accent, 
              letterSpacing: '1.5px',
              marginBottom: '20px'
            }}>
              {service.tag}
            </div>

            {/* Icon Box */}
            <div className="icon-box" style={{ 
              width: '85px', 
              height: '85px', 
              borderRadius: '24px', 
              backgroundColor: 'white', 
              color: service.accent, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '35px',
              boxShadow: '0 15px 30px rgba(0,0,0,0.05)',
              transition: '0.4s'
            }}>
              {service.icon}
            </div>
            
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '15px' }}>
              {service.title}
            </h3>
            
            <p className="serv-desc" style={{ 
              color: '#64748b', 
              lineHeight: '1.8', 
              fontSize: '1rem', 
              marginBottom: '35px',
              transition: '0.4s'
            }}>
              {service.desc}
            </p>

            <div className="serv-btn" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              fontWeight: '800', 
              fontSize: '0.9rem',
              color: '#1a365d',
              transition: '0.4s'
            }}>
              VIEW DETAILS <ArrowRight size={18} />
            </div>

            {/* Subtle Gradient Glow (Bottom Right) */}
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: `radial-gradient(circle, ${service.accent}20 0%, transparent 70%)`
            }} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Services;