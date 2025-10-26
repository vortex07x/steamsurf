import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, LogOut, Lock, Unlock } from 'lucide-react';
import { logout, updateUserMode } from '../utils/api';

const Navigation = ({ onSearchClick, user, setUser }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(user?.mode === 'private');
  const [loggingOut, setLoggingOut] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update mode when user changes
  useEffect(() => {
    if (user) {
      setIsPrivateMode(user.mode === 'private');
    }
  }, [user]);

  // Smooth scroll to top on route change
  useEffect(() => {
    if (isNavigating) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isNavigating]);

  const scrollToLogin = () => {
    if (location.pathname === '/') {
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setIsNavigating(true);
      navigate('/');
      setTimeout(() => {
        const loginSection = document.getElementById('login-section');
        if (loginSection) {
          loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
      setUser(null);
      setIsNavigating(true);
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleModeToggle = async () => {
    if (!user) return;

    const newMode = isPrivateMode ? 'public' : 'private';

    try {
      await updateUserMode(newMode);
      setIsPrivateMode(!isPrivateMode);
      setUser({ ...user, mode: newMode });
      window.dispatchEvent(new CustomEvent('modeChanged', { detail: { mode: newMode } }));

      if (newMode === 'public' && location.pathname === '/explore') {
        setIsNavigating(true);
        navigate('/');
      }
    } catch (error) {
      console.error('Error updating mode:', error);
      alert('Failed to update mode. Please try again.');
    }
  };

  const handleSearchClick = () => {
    if (user && !isPrivateMode) {
      alert('Please switch to Private Mode to access the Explore page');
      return;
    }

    if (location.pathname !== '/explore') {
      setIsNavigating(true);
      navigate('/explore');
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } else {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      setIsNavigating(true);
    }
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    if (location.pathname !== '/') {
      setIsNavigating(true);
    }
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleExploreClick = () => {
    if (user && !isPrivateMode) {
      alert('Please switch to Private Mode to access the Explore page');
      return;
    }

    if (location.pathname !== '/explore') {
      setIsNavigating(true);
    }
    navigate('/explore');
    setMobileMenuOpen(false);
  };

  const handleAdminClick = () => {
    if (location.pathname !== '/admin') {
      setIsNavigating(true);
    }
    navigate('/admin');
    setMobileMenuOpen(false);
  };

  const handleDungeonClick = () => {
    if (!user) {
      alert('Please login to access your Dungeon');
      return;
    }

    if (location.pathname !== '/dungeon') {
      setIsNavigating(true);
    }
    navigate('/dungeon');
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <div className="flex items-center">
            <h1
              onClick={handleLogoClick}
              className="text-4xl md:text-5xl font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
                color: '#ffffff',
                textShadow: '0 0 20px rgba(255,255,255,0.3)',
                letterSpacing: '0.05em'
              }}
            >
              StreamSurf
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button
              onClick={handleHomeClick}
              className={`text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 relative group ${location.pathname === '/' ? 'text-white' : ''
                }`}
            >
              Home
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ${location.pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
              ></span>
            </button>

            <button
              onClick={handleExploreClick}
              className={`text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 relative group ${location.pathname === '/explore' ? 'text-white' : ''
                } ${user && !isPrivateMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={user && !isPrivateMode}
            >
              Explore
              {user && !isPrivateMode && (
                <Lock className="w-3 h-3 inline-block ml-1" />
              )}
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 ${location.pathname === '/explore' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
              ></span>
            </button>

            <button
              onClick={handleDungeonClick}
              className="text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 relative group"
            >
              Dungeon
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </button>

            {user && user.role === 'admin' && (
              <button
                onClick={handleAdminClick}
                className={`text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 relative group ${location.pathname === '/admin' ? 'text-white' : ''
                  }`}
              >
                Admin
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-purple-500 transition-all duration-300 ${location.pathname === '/admin' ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                ></span>
              </button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              onClick={handleSearchClick}
              className={`text-white/60 hover:text-white transition-colors duration-300 ${user && !isPrivateMode ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              title={user && !isPrivateMode ? 'Switch to Private Mode to search' : 'Search videos'}
              disabled={user && !isPrivateMode}
            >
              <Search size={20} />
            </button>

            {/* Mode Toggle - FIXED: Now shows Unlock when locked (private), Lock when unlocked (public) */}
            {user && (
              <button
                onClick={handleModeToggle}
                className={`p-2 rounded-full transition-all duration-300 ${isPrivateMode
                    ? 'text-purple-500 hover:text-purple-400 hover:bg-purple-500/10'
                    : 'text-purple-400 hover:text-purple-500 hover:bg-purple-500/10'
                  }`}
                title={isPrivateMode ? 'Private Mode (Unlocked) - Click to Lock' : 'Public Mode (Locked) - Click to Unlock'}
              >
                {isPrivateMode ? (
                  <Unlock size={22} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                ) : (
                  <Lock size={22} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                )}
              </button>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="border border-white/40 text-white px-6 py-2 text-xs uppercase tracking-widest
                         hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={16} />
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            ) : (
              <button
                onClick={scrollToLogin}
                className="border border-white/40 text-white px-6 py-2 text-xs uppercase tracking-widest
                         hover:bg-white hover:text-black transition-all duration-300"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <button
              onClick={handleSearchClick}
              className={`text-white/60 hover:text-white transition-colors duration-300 ${user && !isPrivateMode ? 'opacity-50' : ''
                }`}
              title={user && !isPrivateMode ? 'Switch to Private Mode to search' : 'Search videos'}
              disabled={user && !isPrivateMode}
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-24 left-0 right-0 bg-black/98 border-b border-white/10 backdrop-blur-md">
            <div className="flex flex-col px-6 py-6 space-y-4">
              <button
                onClick={handleHomeClick}
                className={`text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 text-left ${location.pathname === '/' ? 'text-white' : ''
                  }`}
              >
                Home
              </button>

              <button
                onClick={handleExploreClick}
                disabled={user && !isPrivateMode}
                className={`text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 text-left flex items-center gap-2 ${location.pathname === '/explore' ? 'text-white' : ''
                  } ${user && !isPrivateMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Explore
                {user && !isPrivateMode && <Lock className="w-3 h-3" />}
              </button>

              <button
                onClick={handleDungeonClick}
                className="text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 text-left"
              >
                Dungeon
              </button>

              {user && user.role === 'admin' && (
                <button
                  onClick={handleAdminClick}
                  className={`text-white/80 hover:text-white text-sm uppercase tracking-widest font-medium transition-colors duration-300 text-left ${location.pathname === '/admin' ? 'text-white' : ''
                    }`}
                >
                  Admin
                </button>
              )}

              {/* Mode Toggle Mobile - FIXED */}
              {user && (
                <button
                  onClick={handleModeToggle}
                  className={`flex items-center gap-3 px-4 py-3 border transition-all duration-300 ${isPrivateMode
                      ? 'border-purple-500/50 text-purple-400 bg-purple-500/5'
                      : 'border-purple-400/50 text-purple-300 bg-purple-400/5'
                    }`}
                >
                  {isPrivateMode ? (
                    <>
                      <Unlock size={20} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                      <span className="text-sm uppercase tracking-widest">Private Mode (Unlocked)</span>
                    </>
                  ) : (
                    <>
                      <Lock size={20} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                      <span className="text-sm uppercase tracking-widest">Public Mode (Locked)</span>
                    </>
                  )}
                </button>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="border border-white/40 text-white px-6 py-2 text-xs uppercase tracking-widest
                           hover:bg-white hover:text-black transition-all duration-300 w-full flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={16} />
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              ) : (
                <button
                  onClick={scrollToLogin}
                  className="border border-white/40 text-white px-6 py-2 text-xs uppercase tracking-widest
                           hover:bg-white hover:text-black transition-all duration-300 w-full"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;