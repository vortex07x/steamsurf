import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import VideoCard from '../components/VideoCard';  // IMPORT VideoCard
import { Bookmark, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchSavedVideos, fetchViewHistory, unsaveVideo } from '../utils/api';

const DungeonPage = ({ onVideoSelect, user, setUser, onVideoUpdate }) => {  // ADD onVideoUpdate prop
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'history'
  const [savedVideos, setSavedVideos] = useState([]);
  const [historyVideos, setHistoryVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsaving, setUnsaving] = useState(null);
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load data when tab changes
  useEffect(() => {
    if (user) {
      if (activeTab === 'saved') {
        loadSavedVideos();
      } else {
        loadHistoryVideos();
      }
    }
  }, [activeTab, user]);

  const loadSavedVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSavedVideos();
      console.log('📚 Loaded saved videos:', data);
      setSavedVideos(data);
    } catch (err) {
      console.error('❌ Error loading saved videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchViewHistory();
      console.log('📜 Loaded history videos:', data);
      setHistoryVideos(data);
    } catch (err) {
      console.error('❌ Error loading history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (videoId, e) => {
    e.stopPropagation();
    
    if (unsaving) return;

    if (!window.confirm('Remove this video from saved?')) return;

    setUnsaving(videoId);
    try {
      await unsaveVideo(videoId);
      setSavedVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      alert(err.message || 'Failed to remove video');
    } finally {
      setUnsaving(null);
    }
  };

  const handleInteraction = (videoId, type, result) => {
    // Update the video in saved/history lists
    if (activeTab === 'saved') {
      setSavedVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? {
                ...video,
                likes: result.likes,
                dislikes: result.dislikes,
                userInteraction: {
                  like: result.userLiked,
                  dislike: result.userDisliked
                }
              }
            : video
        )
      );
    } else {
      setHistoryVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? {
                ...video,
                likes: result.likes,
                dislikes: result.dislikes,
                userInteraction: {
                  like: result.userLiked,
                  dislike: result.userDisliked
                }
              }
            : video
        )
      );
    }

    // Also update parent state if callback provided
    if (onVideoUpdate) {
      onVideoUpdate(videoId, {
        likes: result.likes,
        dislikes: result.dislikes,
        userInteraction: {
          like: result.userLiked,
          dislike: result.userDisliked
        }
      });
    }
  };

  // Horizontal scroll function
  const scrollContainer = (direction) => {
    const container = document.getElementById('horizontal-scroll');
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation onSearchClick={() => {}} user={user} setUser={setUser} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation onSearchClick={() => {}} user={user} setUser={setUser} />

      {/* Page Header */}
      <div className="pt-32 pb-16 bg-gradient-to-b from-black via-black to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1
              className="text-5xl md:text-7xl text-white mb-6 uppercase tracking-[0.3em] font-light"
              style={{
                fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
                textShadow: '0 0 40px rgba(255,255,255,0.2)',
              }}
            >
              Dungeon
            </h1>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-6"></div>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Your personal vault of saved videos and viewing history
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-6 py-3 border-2 transition-all duration-300 ${
                activeTab === 'saved'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30'
              }`}
            >
              <Bookmark size={20} />
              <span className="font-medium uppercase tracking-wider text-sm">
                Saved Videos
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 border-2 transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30'
              }`}
            >
              <History size={20} />
              <span className="font-medium uppercase tracking-wider text-sm">
                Watch History
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={activeTab === 'saved' ? loadSavedVideos : loadHistoryVideos} 
          />
        )}

        {/* Saved Videos Section */}
        {activeTab === 'saved' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Saved Videos
              </h2>
              <p className="text-white/60 text-sm">
                {savedVideos.length} {savedVideos.length === 1 ? 'video' : 'videos'} saved
              </p>
            </div>

            {savedVideos.length === 0 ? (
              <div className="text-center py-20">
                <Bookmark size={64} className="mx-auto mb-6 text-white/20" />
                <p className="text-white/60 text-xl mb-2">No saved videos yet</p>
                <p className="text-white/40 text-sm mb-6">
                  Save videos while watching to access them here
                </p>
                <button
                  onClick={() => navigate('/explore')}
                  className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors uppercase tracking-wider text-sm font-medium"
                >
                  Browse Videos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className="opacity-0 animate-fadeIn relative"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {/* Unsave Button Overlay */}
                    <button
                      onClick={(e) => handleUnsave(video.id, e)}
                      disabled={unsaving === video.id}
                      className="absolute top-2 right-2 z-10 p-2 bg-purple-600/90 hover:bg-red-600/90 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 rounded"
                      title="Remove from saved"
                    >
                      <Bookmark size={16} className="text-white" fill="white" />
                    </button>

                    <div className="group">
                      <VideoCard
                        video={video}
                        onClick={onVideoSelect}
                        user={user}
                        onInteraction={handleInteraction}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {activeTab === 'history' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Watch History
                </h2>
                <p className="text-white/60 text-sm">
                  {historyVideos.length} {historyVideos.length === 1 ? 'video' : 'videos'} watched
                </p>
              </div>

              {historyVideos.length > 4 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollContainer('left')}
                    className="p-2 bg-white/5 border border-white/10 text-white hover:bg-purple-600/20 hover:border-purple-500/30 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => scrollContainer('right')}
                    className="p-2 bg-white/5 border border-white/10 text-white hover:bg-purple-600/20 hover:border-purple-500/30 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {historyVideos.length === 0 ? (
              <div className="text-center py-20">
                <History size={64} className="mx-auto mb-6 text-white/20" />
                <p className="text-white/60 text-xl mb-2">No watch history</p>
                <p className="text-white/40 text-sm mb-6">
                  Videos you watch will appear here
                </p>
                <button
                  onClick={() => navigate('/explore')}
                  className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors uppercase tracking-wider text-sm font-medium"
                >
                  Start Watching
                </button>
              </div>
            ) : (
              <div
                id="horizontal-scroll"
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                }}
              >
                {historyVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex-shrink-0 w-80"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <VideoCard
                      video={video}
                      onClick={onVideoSelect}
                      user={user}
                      onInteraction={handleInteraction}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer user={user} setUser={setUser} />
    </div>
  );
};

export default DungeonPage;