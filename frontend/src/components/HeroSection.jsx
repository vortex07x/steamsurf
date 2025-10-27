import React, { useEffect, useState } from 'react';
import { updateUserMode } from '../utils/api';

const HeroSection = ({ isPrivateMode, setIsPrivateMode, user, setUser, heroToggleRef, isServerWaking }) => {
  const [scrollY, setScrollY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToLogin = () => {
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleMode = async () => {
    if (!user) {
      scrollToLogin();
      return;
    }

    setIsAnimating(true);
    const newMode = isPrivateMode ? 'public' : 'private';
    
    try {
      await updateUserMode(newMode);
      setIsPrivateMode(!isPrivateMode);
      setUser({ ...user, mode: newMode });
      window.dispatchEvent(new CustomEvent('modeChanged', { detail: { mode: newMode } }));
      
      setTimeout(() => setIsAnimating(false), 500);
    } catch (error) {
      console.error('Error updating mode:', error);
      alert('Failed to update mode. Please try again.');
      setIsAnimating(false);
    }
  };

  // Calculate opacity for fade out effect during server wake up
  const contentOpacity = isServerWaking ? 0 : Math.max(0, 1 - scrollY / 500);
  const contentTransform = isServerWaking ? 'scale(0.95)' : 'none';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Hero Image with Parallax Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2031&auto=format&fit=crop)',
          transform: `translateY(${scrollY * 0.5}px) scale(${isServerWaking ? 1.05 : 1})`,
          filter: `grayscale(100%) contrast(1.1) blur(${isServerWaking ? '8px' : '0px'})`,
          opacity: isServerWaking ? 0.3 : 1,
        }}
      />
      
      {/* Dark Overlay - Gradient from transparent to black */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black transition-opacity duration-700"
        style={{ opacity: isServerWaking ? 0.95 : 1 }}
      />
      
      {/* Vignette Effect */}
      <div 
        className="absolute inset-0 transition-opacity duration-700" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
          opacity: isServerWaking ? 0.5 : 1,
        }} 
      />

      {/* Content Container */}
      <div 
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 transition-all duration-700"
        style={{
          opacity: contentOpacity,
          transform: `translateY(${scrollY * 0.3}px) ${contentTransform}`,
          pointerEvents: isServerWaking ? 'none' : 'auto',
        }}
      >
        {/* Main Heading */}
        <h1 
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white text-center mb-8 transition-all duration-700"
          style={{
            fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
            textShadow: '0 0 40px rgba(255,255,255,0.3)',
            letterSpacing: '0.05em',
          }}
        >
          STREAM<span className="text-purple-500">SURF</span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-white/70 text-lg md:text-xl text-center max-w-2xl mb-12 transition-all duration-700"
        >
          Experience the ultimate video collection. Dark. Elegant. Powerful.
        </p>

        {/* Login Button - Only show when NOT logged in */}
        {!user && (
          <button 
            onClick={scrollToLogin}
            disabled={isServerWaking}
            className="border-2 border-white text-white px-12 py-4 uppercase tracking-[0.3em] text-sm
                     hover:bg-white hover:text-black transition-all duration-300 mb-8
                     disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Enter The Vault
          </button>
        )}

        {/* Private/Public Mode Toggle - Only show when logged in */}
        {user && (
          <div 
            ref={heroToggleRef}
            className="flex items-center gap-6 transition-all duration-700"
          >
            <span className="text-white/60 text-xs uppercase tracking-[0.2em] font-light">
              {isPrivateMode ? 'Private' : 'Public'}
            </span>
            
            <button
              onClick={toggleMode}
              disabled={isServerWaking}
              className={`relative w-24 h-12 rounded-full transition-all duration-400 border-2 ${
                isPrivateMode 
                  ? 'bg-purple-600/20 border-purple-500' 
                  : 'bg-white/5 border-white/30'
              } cursor-pointer overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {/* Background Glow Effect */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-500 ${
                  isPrivateMode 
                    ? 'bg-purple-500/30 blur-xl' 
                    : 'bg-white/10 blur-xl'
                }`}
              />

              {/* Toggle Slider */}
              <div
                className={`absolute top-1 w-9 h-9 rounded-full shadow-2xl flex items-center justify-center
                          transition-all duration-500 ease-in-out ${
                            isPrivateMode 
                              ? 'left-[calc(100%-2.5rem)] bg-gradient-to-br from-purple-500 to-purple-700' 
                              : 'left-1 bg-gradient-to-br from-white to-gray-100'
                          } ${isAnimating ? 'scale-110' : 'scale-100'}`}
                style={{
                  boxShadow: isPrivateMode 
                    ? '0 4px 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.4)' 
                    : '0 4px 20px rgba(255, 255, 255, 0.4)'
                }}
              >
                {/* Icon Container with Smooth Rotation */}
                <div 
                  className={`transition-all duration-500 ${
                    isAnimating ? 'rotate-180 scale-90' : 'rotate-0 scale-100'
                  }`}
                >
                  {isPrivateMode ? (
                    // Devilish/Private Icon - Horns
                    <svg 
                      className="w-6 h-6 text-white drop-shadow-lg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M12 3C8 3 5 6 5 10c0 2 1 4 2 5 0 0 0 3 5 3s5-3 5-3c1-1 2-3 2-5 0-4-3-7-7-7z"/>
                      <path d="M8 3L7 6M16 3l1 3"/>
                      <circle cx="9" cy="11" r="1" fill="currentColor"/>
                      <circle cx="15" cy="11" r="1" fill="currentColor"/>
                      <path d="M9 14c1 1 2 1.5 3 1.5s2-.5 3-1.5"/>
                    </svg>
                  ) : (
                    // Angel/Public Icon - Halo
                    <svg 
                      className="w-6 h-6 text-gray-800 drop-shadow-lg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="6" r="3" strokeWidth="2.5"/>
                      <path d="M12 11c-4 0-7 3-7 7v2h14v-2c0-4-3-7-7-7z"/>
                      <circle cx="9" cy="14" r="1" fill="currentColor"/>
                      <circle cx="15" cy="14" r="1" fill="currentColor"/>
                      <path d="M10 17c.5.5 1 1 2 1s1.5-.5 2-1"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Ripple Effect on Toggle */}
              {isAnimating && (
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full animate-ping ${
                    isPrivateMode ? 'left-[calc(100%-2.5rem)] bg-purple-500/50' : 'left-1 bg-white/50'
                  }`}
                />
              )}
            </button>
            
            <span className="text-white/60 text-xs uppercase tracking-[0.2em] font-light">
              {isPrivateMode ? 'Vault' : 'Safe'}
            </span>
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-20 transition-all duration-700"
        style={{
          opacity: isServerWaking ? 0 : Math.max(0, 1 - scrollY / 300),
          transform: `translateX(-50%) scale(${isServerWaking ? 0.8 : 1})`,
        }}
      >
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;