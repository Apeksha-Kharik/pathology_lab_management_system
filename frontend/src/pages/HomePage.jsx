import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import StatsGrid from '../components/StatsGrid';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div data-testid="homepage">
      <Navbar />
      <Hero />
      <StatsGrid />
      <Footer />
    </div>
  );
};

export default HomePage;