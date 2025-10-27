import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ColdStartLoader from '../components/ColdStartLoader';
import { fetchVideos, checkBackendHealth } from '../utils/api';

const HomePage = ({ onVideoSelect, user, setUser, authLoading }) => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [isPrivateMode, setIsPrivateMode] = useState(user?.mode === 'private');
  const [videoError, setVideoError] = useState(false);
  const [showNavToggle, setShowNavToggle] = useState(false);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const heroToggleRef = useRef(null);
  const healthCheckDone = useRef(false);

  // Update mode when user changes
  useEffect(() => {
    if (user) {
      setIsPrivateMode(user.mode === 'private');
    } else {
      setIsPrivateMode(true);
    }
  }, [user]);

  // Listen for mode changes from Navigation
  useEffect(() => {
    const handleModeChange = (e) => {
      setIsPrivateMode(e.detail.mode === 'private');
    };

    window.addEventListener('modeChanged', handleModeChange);
    return () => window.removeEventListener('modeChanged', handleModeChange);
  }, []);

  // Health check and load videos
  useEffect(() => {
    const initializeApp = async () => {
      if (healthCheckDone.current) return;
      healthCheckDone.current = true;

      try {
        // Check backend health first
        console.log('🏥 Checking backend health...');
        const healthStatus = await checkBackendHealth();

        console.log('🏥 Health status:', healthStatus);

        // If cold start detected, show loader
        if (healthStatus.isColdStart || !healthStatus.isAwake) {
          console.log('🥶 Cold start detected! Showing loader...');
          setIsServerWaking(true);

          // Keep checking until server is awake
          let attempts = 0;
          const maxAttempts = 20; // Max 20 attempts (about 60 seconds)

          const checkInterval = setInterval(async () => {
            attempts++;
            console.log(`🔄 Health check attempt ${attempts}/${maxAttempts}...`);

            const status = await checkBackendHealth();

            if (status.isAwake && !status.isColdStart) {
              console.log('✅ Server is awake!');
              clearInterval(checkInterval);
              setIsServerWaking(false);
              loadVideos();
            } else if (attempts >= maxAttempts) {
              console.log('⏰ Max attempts reached, proceeding anyway...');
              clearInterval(checkInterval);
              setIsServerWaking(false);
              loadVideos();
            }
          }, 3000); // Check every 3 seconds
        } else {
          // Server is already awake, load videos directly
          console.log('✅ Server is awake, loading videos...');
          loadVideos();
        }
      } catch (err) {
        console.error('❌ Health check failed:', err);
        // Proceed to load videos anyway
        loadVideos();
      }
    };

    initializeApp();

    const handleScroll = () => {
      setScrollY(window.scrollY);

      if (heroToggleRef.current && user) {
        const toggleRect = heroToggleRef.current.getBoundingClientRect();
        const hasPassed = toggleRect.bottom < 0;
        setShowNavToggle(hasPassed);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVideos();
      console.log('Fetched videos:', data);

      if (data && data.length > 0) {
        console.log('First video object:', data[0]);
        console.log('Video URL:', data[0].videoUrl);
        console.log('Thumbnail URL:', data[0].thumbnailUrl);
      }

      setVideos(data);
      setFilteredVideos(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Show cold start loader
  if (isServerWaking) {
    return <ColdStartLoader isWakingUp={isServerWaking} />;
  }

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadVideos} />;
  }

  // Fixed scroll effect timing - appears earlier and smoother
  const contentOpacity = Math.min(1, Math.max(0, (scrollY - 200) / 200));
  const featuredVideo = filteredVideos[0];

  const shouldShowVideos = !user || isPrivateMode;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation
        onSearchClick={() => document.getElementById('search-input')?.focus()}
        user={user}
        setUser={setUser}
        showModeToggle={showNavToggle}
      />

      <HeroSection
        isPrivateMode={isPrivateMode}
        setIsPrivateMode={setIsPrivateMode}
        user={user}
        setUser={setUser}
        heroToggleRef={heroToggleRef}
        isServerWaking={isServerWaking}
      />

      {/* Featured Video Section - Simplified showcase only */}
      {shouldShowVideos && featuredVideo ? (
        <div
          className="relative z-10 bg-black transition-all duration-500"
          style={{
            opacity: contentOpacity,
            transform: `translateY(${Math.max(0, 30 - scrollY / 15)}px)`,
          }}
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 lg:py-32">
            {/* Section Title */}
            <div className="text-center mb-10 sm:mb-16 lg:mb-20">
              <div className="inline-block">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4 uppercase tracking-[0.3em] font-light"
                  style={{
                    fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
                  }}
                >
                  The Vault
                </h2>
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
            </div>

            {/* Large Cinematic Video Card - Showcase Only */}
            <div className="max-w-[1400px] mx-auto">
              <div
                className="relative overflow-hidden group rounded-none sm:rounded-lg cursor-pointer"
                style={{ aspectRatio: '16/9' }}
                onClick={() => onVideoSelect(featuredVideo)}
              >
                {/* Video Container with Fade Effect */}
                <div className="relative w-full h-full">
                  {/* Video Element or Thumbnail */}
                  {!videoError && featuredVideo.videoUrl ? (
                    <video
                      key={featuredVideo.id}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{
                        filter: 'brightness(0.65) contrast(1.1)',
                      }}
                      onError={(e) => {
                        console.error('❌ Video loading failed!');
                        console.error('Video element error:', e);
                        console.error('Failed URL:', featuredVideo.videoUrl);
                        setVideoError(true);
                      }}
                      onLoadedData={() => {
                        console.log('✅ Video loaded successfully!');
                        setVideoError(false);
                      }}
                      onCanPlay={() => console.log('✅ Video can play')}
                      onLoadStart={() => console.log('⏳ Video loading started...')}
                    >
                      <source src={featuredVideo.videoUrl} type="video/mp4" />
                      <source src={featuredVideo.videoUrl} type="video/webm" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={featuredVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1600&h=900&fit=crop'}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{
                          filter: 'brightness(0.65) contrast(1.1)',
                        }}
                        onError={(e) => {
                          console.error('❌ Thumbnail also failed:', featuredVideo.thumbnailUrl);
                          e.target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1600&h=900&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Faded Boundaries - Enhanced for visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-95" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-transparent to-black/70 opacity-80" />

                  {/* Enhanced Vignette Effect */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse at center, transparent 10%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)'
                    }}
                  />

                  {/* Hover Overlay - Subtle interaction feedback */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-500" />
                </div>

                {/* Content Overlay - Minimal showcase */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20">
                  {/* Category Badge - Only if available */}
                  {featuredVideo.category && (
                    <div className="mb-4 sm:mb-5 lg:mb-6">
                      <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 border border-purple-500/50 text-purple-400 text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] bg-black/40 backdrop-blur-sm">
                        {featuredVideo.category}
                      </span>
                    </div>
                  )}

                  {/* Title - Main focus */}
                  <h3
                    className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 max-w-4xl leading-tight"
                    style={{
                      fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
                      textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)',
                      lineHeight: '1.2',
                    }}
                  >
                    {featuredVideo.title}
                  </h3>

                  {/* Description - Optional, shown on larger screens */}
                  {featuredVideo.description && (
                    <p className="hidden md:block text-white/70 text-base lg:text-lg mb-6 lg:mb-8 max-w-3xl leading-relaxed line-clamp-2">
                      {featuredVideo.description}
                    </p>
                  )}

                  {/* Subtle hint to click */}
                  <div className="flex items-center gap-3 text-white/50 text-sm group-hover:text-white/70 transition-colors duration-300">
                    <span className="uppercase tracking-[0.2em] text-xs sm:text-sm">Click to explore</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : shouldShowVideos && !featuredVideo ? (
        <div className="relative z-10 bg-black min-h-[60vh] flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-4xl sm:text-6xl mb-4">🎬</div>
            <p className="text-white/60 text-lg sm:text-xl">No videos available</p>
            <p className="text-white/40 text-xs sm:text-sm mt-2">Please add videos to your collection</p>
          </div>
        </div>
      ) : null}

      {/* Public Mode Message */}
      {user && !isPrivateMode && (
        <div
          className="relative z-10 bg-black min-h-[60vh] flex items-center justify-center transition-all duration-500"
          style={{
            opacity: contentOpacity,
            transform: `translateY(${Math.max(0, 30 - scrollY / 15)}px)`,
          }}
        >
          <div className="text-center px-6">
            <div className="mb-6 sm:mb-8 flex justify-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h3
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white mb-4 sm:mb-6 uppercase tracking-[0.3em] font-light"
              style={{
                fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
              }}
            >
              Safe Mode
            </h3>

            <p className="text-white/60 text-sm sm:text-base lg:text-lg mb-4 max-w-md mx-auto">
              The vault is sealed. Switch to Private Mode to unlock exclusive content.
            </p>

            <div className="h-px w-24 sm:w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mt-6 sm:mt-8"></div>
          </div>
        </div>
      )}

      <Footer user={user} setUser={setUser} />
    </div>
  );
};

export default HomePage;