import React from 'react';
import { HeroSection } from '../components/ui/HeroSection';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
    </div>
  );
};

export default HomePage;