import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Award, Microscope, CheckCircle2 } from 'lucide-react';

const TrustSection = () => {
  const features = [
    { 
      title: "NABL Accredited", 
      icon: <Award size={24} />, 
      desc: "Meeting global standards for diagnostic accuracy and reliability." 
    },
    { 
      title: "Fast Turnaround", 
      icon: <Zap size={24} />, 
      desc: "Digital reports delivered to your WhatsApp within 12-24 hours." 
    },
    { 
      title: "AI-Powered Insights", 
      icon: <Microscope size={24} />, 
      desc: "Advanced trend analysis to track your health metrics over time." 
    },
    { 
      title: "Privacy First", 
      icon: <ShieldCheck size={24} />, 
      desc: "100% encrypted data handling following strict HIPAA protocols." 
    }
  ];

  return (
    <section style={{ 
      padding: '120px 8%', 
      backgroundColor: '#f8fafc', // Subtle blue-grey tint to break the white
      display: 'flex', 
      flexWrap: 'wrap', 
      alignItems: 'center', 
      gap: '80px' 
    }}>
      
      {/* Left Side: Visual Card */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ 
          flex: '1 1 450px', 
          height: '550px', 
          position: 'relative',
          borderRadius: '40px',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(26, 54, 93, 0.15)'
        }}
      >
        {/* Placeholder for a professional medical image */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundColor: '#1a365d',
          backgroundImage: 'url("https://images.unsplash.com/photo-1579152276502-7b1f241d5bce?auto=format&fit=crop&q=80")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        
        {/* Glassmorphism Overlay Card */}
        <div style={{ 
          position: 'absolute', 
          bottom: '30px', 
          left: '30px', 
          right: '30px',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(15px)',
          borderRadius: '25px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '800' }}>Precision is our Priority</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.6' }}>
            "Our laboratory combines robotic automation with expert pathology to ensure every report is a benchmark of accuracy."
          </p>
        </div>
      </motion.div>

      {/* Right Side: Content */}
      <div style={{ flex: '1 1 450px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span style={{ 
            color: '#3182ce', 
            fontWeight: '800', 
            letterSpacing: '2px', 
            fontSize: '0.85rem',
            textTransform: 'uppercase'
          }}>
            Why INDIPATH?
          </span>
          <h2 style={{ 
            fontSize: '3rem', 
            color: '#1a365d', 
            fontWeight: '900', 
            lineHeight: '1.1',
            margin: '15px 0 30px 0' 
          }}>
            Setting the standard in <br />
            <span style={{ color: '#3182ce' }}>modern diagnostics.</span>
          </h2>
        </motion.div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '40px' 
        }}>
          {features.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div style={{ 
                color: '#3182ce', 
                backgroundColor: '#ffffff',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
              }}>
                {item.icon}
              </div>
              <h4 style={{ color: '#1a365d', fontWeight: '800', marginBottom: '8px' }}>
                {item.title}
              </h4>
              <p style={{ color: '#718096', fontSize: '0.85rem', lineHeight: '1.6' }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <div style={{ 
          marginTop: '50px', 
          paddingTop: '30px', 
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '30px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a365d', fontWeight: '700', fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} color="#3182ce" /> NABL Certified
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a365d', fontWeight: '700', fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} color="#3182ce" /> ISO 9001:2015
          </div>
        </div>
      </div>

    </section>
  );
};

export default TrustSection;