import React, { useEffect, useState } from 'react';

const ColdStartLoader = ({ isWakingUp, onComplete }) => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isWakingUp) return;

    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Progress bar animation (simulated)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        // Slower progress as it gets closer to 100
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, [isWakingUp]);

  // Complete animation when server wakes up
  useEffect(() => {
    if (!isWakingUp && progress > 0) {
      setProgress(100);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    }
  }, [isWakingUp, progress, onComplete]);

  if (!isWakingUp && progress === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="text-center px-6 max-w-md">
        {/* Animated Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
          
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-4 bg-purple-500/20 rounded-full animate-pulse"></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <h3 
          className="text-2xl sm:text-3xl text-white mb-3 uppercase tracking-[0.3em] font-light"
          style={{
            fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
          }}
        >
          Waking Up Server{dots}
        </h3>

        {/* Subtitle */}
        <p className="text-white/60 text-sm sm:text-base mb-8 leading-relaxed">
          The server is starting up after a period of inactivity.
          <br />
          <span className="text-white/40 text-xs">This may take up to 60 seconds (first time only)</span>
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 transition-all duration-300 ease-out rounded-full"
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
            }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="mt-3 text-white/40 text-xs tracking-widest">
          {progress}%
        </div>

        {/* Fun Fact */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-white/30 text-xs italic">
            💡 Pro tip: The server sleeps after 15 minutes of inactivity on the free tier
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColdStartLoader;