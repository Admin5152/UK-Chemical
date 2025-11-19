import React, { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number; // Minimum time to show splash in ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, minDuration = 2500 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(0); // Start invisible for fade-in
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  useEffect(() => {
    // 1. Fade In immediately on mount
    const fadeInTimer = setTimeout(() => setOpacity(1), 50);

    // 2. Wait for minimum duration, then trigger fade out
    const waitTimer = setTimeout(() => {
      setShouldFadeOut(true);
    }, minDuration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(waitTimer);
    };
  }, [minDuration]);

  useEffect(() => {
    if (shouldFadeOut) {
      // 3. Start fading out
      setOpacity(0);
      
      // 4. After fade out transition finishes (700ms), remove component
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 700); // Matches CSS duration

      return () => clearTimeout(removeTimer);
    }
  }, [shouldFadeOut, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out"
      style={{ opacity: opacity }}
    >
      <div className="flex flex-col items-center animate-pulse">
        {/* 
            REPLACE THE SRC BELOW with your actual logo path (e.g., "/logo.png") 
            I'm using a professional placeholder that matches your description.
        */}
        <div className="relative mb-6">
           {/* Logo Container with Shadow */}
           <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
              {/* Placeholder Image / Icon */}
              <FlaskConical size={64} className="text-brand-600" />
              {/* If you have an image file, uncomment this and remove the icon above:
              <img src="/logo.png" alt="UKChem Logo" className="w-24 h-24 object-contain" /> 
              */}
           </div>
           {/* Floating Badge */}
           <div className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
             v1.0
           </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
            <span className="text-brand-600">UK</span>Chem
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.3em]">
            Inventory System
          </p>
        </div>

        {/* Loading Bar */}
        <div className="mt-12 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] text-slate-300 font-medium">
          SECURE CONNECTION ESTABLISHED
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
