import React, { useEffect, useState } from 'react';
// IMPORT YOUR IMAGES HERE
import bg1 from '../assets/bg1.png';
import bg2 from '../assets/bg2.png';
import bg3 from '../assets/bg3.png';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const slides = [bg1, bg2, bg3];

  useEffect(() => {
    setLoaded(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <header style={{ 
      position: 'relative', 
      height: '85vh', 
      display: 'flex', 
      alignItems: 'center', 
      overflow: 'hidden', 
      backgroundColor: '#0f172a' 
    }}>
      
      {/* Background Slideshow */}
      {slides.map((image, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9) 20%, rgba(15, 23, 42, 0.1) 80%), url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            opacity: currentSlide === index ? 1 : 0,
            transform: currentSlide === index ? 'scale(1.1)' : 'scale(1)',
            transition: 'opacity 1.5s ease-in-out, transform 6s linear',
            zIndex: 1
          }}
        />
      ))}

      {/* Content Layer */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        padding: '0 8%', 
        color: 'white',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1.2s cubic-bezier(0.2, 1, 0.3, 1) 0.5s'
      }}>
        <div style={{ 
          display: 'inline-block', 
          padding: '5px 15px', 
          background: 'rgba(96, 165, 250, 0.2)', 
          borderLeft: '4px solid #60a5fa',
          fontSize: '0.75rem', 
          fontWeight: '700', 
          letterSpacing: '2px', 
          marginBottom: '25px' 
        }}>
          ADVANCED PATHOLOGY SERVICES
        </div>

        <h2 style={{ fontSize: '4.5rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px' }}>
          Precision results. <br/>
          <span style={{ color: '#60a5fa' }}>Expert care.</span>
        </h2>

        <p style={{ fontSize: '1.2rem', maxWidth: '550px', opacity: 0.8, lineHeight: '1.7', marginBottom: '40px' }}>
          Providing NABL-accredited diagnostic excellence with cutting-edge robotic automation and AI-integrated reports.
        </p>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button style={{ 
            padding: '16px 40px', 
            backgroundColor: '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: '700', 
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)'
          }}>BOOK NOW</button>
          
          <button style={{ 
            padding: '16px 40px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            color: 'white', 
            border: '1px solid rgba(255,255,255,0.3)', 
            borderRadius: '4px', 
            fontWeight: '700', 
            cursor: 'pointer',
            backdropFilter: 'blur(5px)'
          }}>LEARN MORE</button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div style={{ position: 'absolute', bottom: '40px', left: '8%', zIndex: 3, display: 'flex', gap: '8px' }}>
        {slides.map((_, i) => (
          <div key={i} style={{ 
            width: currentSlide === i ? '30px' : '8px', 
            height: '4px', 
            background: currentSlide === i ? '#60a5fa' : 'rgba(255,255,255,0.3)', 
            borderRadius: '2px',
            transition: '0.5s'
          }} />
        ))}
      </div>
    </header>
  );
};

export default Hero;