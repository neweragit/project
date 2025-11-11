import React, { useEffect, useState } from 'react';
import { Rocket, Star } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  isTransitioning?: boolean;
}

export function LoadingScreen({ onLoadingComplete, isTransitioning = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onLoadingComplete(), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background starfield transition-all duration-700 ease-in-out ${
      isTransitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
    }`}>
      <div className={`text-center space-y-8 transition-all duration-500 ease-out ${
        isTransitioning ? 'transform translate-y-8 opacity-0' : 'transform translate-y-0 opacity-100'
      }`}>
        {/* Animated rocket */}
        <div className="relative">
          <Rocket className="w-20 h-20 mx-auto text-primary animate-rocket" />
          <div className="absolute -top-3 -right-3 animate-pulse">
            <Star className="w-8 h-8 text-accent" />
          </div>
          <div className="absolute -bottom-2 -left-2 animate-pulse delay-300">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute top-1/2 -right-8 animate-pulse delay-700">
            <Star className="w-4 h-4 text-accent/60" />
          </div>
          {/* Rocket trail effect */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
            <div className="w-2 h-8 bg-gradient-cosmic opacity-60 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-4">
          <h2 className="text-3xl font-orbitron font-bold text-glow">
            NEW ERA
          </h2>
          <p className="text-muted-foreground animate-pulse">
            Launching into the future...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-cosmic transition-all duration-300 ease-out rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}