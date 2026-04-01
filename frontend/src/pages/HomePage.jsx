import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import StatsGrid from '../components/StatsGrid';
import Services from '../components/Services';
import ExpertMessages from '../components/ExpertMessages'; // NEW component
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />

      {/* SECTION 1: HERO (Image Focus) */}
      <div style={{ backgroundColor: '#111827' }}> {/* Keep it dark to make content pop */}
        <Hero />
      </div>

      {/* SECTION 2: STATS (Colorful & Tinted) */}
      {/* We will move it here, directly after the Hero, to bridge the dark/light transition. */}
      <div style={{ backgroundColor: '#f0f7ff', borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
        <StatsGrid />
      </div>

      {/* SECTION 3: SERVICES (Colorful Pure White) */}
      <div style={{ 
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(#e2e8f0 0.5px, transparent 0.5px)', // Subtle pattern for texture
        backgroundSize: '30px 30px'
      }}>
        <Services />
      </div>

      {/* SECTION 4: EXPERT MESSAGES (Dark/Glassmorphism Section) */}
      {/* A dark, colorful section to make the sliding messages feel high-tech. */}
      <div style={{ 
        backgroundColor: '#1a365d', 
        padding: '120px 0', 
        position: 'relative'
      }}>
        <ExpertMessages />
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;