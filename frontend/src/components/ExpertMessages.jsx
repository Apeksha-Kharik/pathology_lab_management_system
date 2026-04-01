import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';

const doctors = [
  {
    name: "Dr. Antonio Banderas",
    role: "Chief Pathologist",
    msg: "Our commitment to precision ensures that every patient receives the highest quality of diagnostic care possible.",
    img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Dr. Margot Robbie",
    role: "Genetic Specialist",
    msg: "We integrate AI-driven research with clinical expertise to provide insights that truly transform lives.",
    img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
  }
];

const ExpertMessages = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % doctors.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section style={{ padding: '120px 8%', backgroundColor: '#1a365d', overflow: 'hidden' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '40px', 
              maxWidth: '1100px',
              width: '100%' 
            }}
          >
            {/* 1. Circle Photo with Border Glow */}
            <div style={{ 
              width: '280px', 
              height: '280px', 
              borderRadius: '50%', 
              border: '8px solid rgba(45, 212, 191, 0.3)', // Aqua Glow
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 0 50px rgba(45, 212, 191, 0.2)'
            }}>
              <img src={doctors[index].img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* 2. Rectangular Message with Glass Effect */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              padding: '60px',
              borderRadius: '40px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              flex: 1
            }}>
              <Quote size={60} style={{ position: 'absolute', top: '20px', right: '40px', color: '#2dd4bf', opacity: 0.3 }} />
              
              <h4 style={{ color: '#2dd4bf', fontWeight: '800', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '15px' }}>
                EXPERT MESSAGE
              </h4>
              
              <p style={{ color: '#ffffff', fontSize: '1.6rem', lineHeight: '1.6', fontWeight: '500', marginBottom: '30px' }}>
                "{doctors[index].msg}"
              </p>

              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{doctors[index].name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '5px 0 0 0' }}>{doctors[index].role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ExpertMessages;