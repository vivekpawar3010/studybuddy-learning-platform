import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
}

const ParticleBackground: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles on client side to match "createFloatingParticles" from original JS
    const particleCount = 6;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        size: Math.random() * 40 + 10,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 3 + 4, // Slower for smoother feel
        delay: Math.random() * 2,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle animate-float"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: `rgba(102, 126, 234, ${Math.random() * 0.2 + 0.1})`, // Light blue-ish
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;