import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import SearchFilterBar from '../components/SearchFilterBar';
import VideoCard from '../components/VideoCard';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { incrementVideoView, fetchAllTags } from '../utils/api';

const ExplorePage = ({ onVideoSelect, user, setUser, videos, onVideoUpdate }) => {
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPrivateMode, setIsPrivateMode] = useState(user?.mode === 'private');
  const navigate = useNavigate();

  // Update mode when user changes
  useEffect(() => {
    if (user) {
      setIsPrivateMode(user.mode === 'private');
    } else {
      setIsPrivateMode(true); // Default to private for logged-out users (show videos)
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

  // Load tags on mount
  useEffect(() => {
    loadTags();
  }, []);

  // Update filtered videos when videos prop changes
  useEffect(() => {
    if (videos && videos.length > 0) {
      // Normalize tags to lowercase for all videos
      const normalizedVideos = videos.map(video => ({
        ...video,
        tags: video.tags ? video.tags.map(tag => tag.toLowerCase()) : [],
        duration: video.duration || 0
      }));

      // Extract unique categories
      const uniqueCategories = [...new Set(normalizedVideos.map(v => v.category))];
      setCategories(uniqueCategories);

      setFilteredVideos(normalizedVideos);
    }
  }, [videos]);

  const loadTags = async () => {
    try {
      const tags = await fetchAllTags();
      const normalizedTags = [...new Set(tags.map(tag => tag.toLowerCase()))].sort();
      setAllTags(normalizedTags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const handleVideoSelect = async (video) => {
    // Increment view only if user is logged in
    if (user) {
      try {
        const result = await incrementVideoView(video.id);
        // Update through parent
        onVideoUpdate(video.id, { views: result.views });
      } catch (error) {
        console.error('Error incrementing view:', error);
      }
    }

    onVideoSelect(video);
  };

  const handleInteraction = (videoId, type, result) => {
    // Update through parent
    onVideoUpdate(videoId, {
      likes: result.likes,
      dislikes: result.dislikes,
      userInteraction: {
        like: result.userLiked,
        dislike: result.userDisliked
      }
    });
  };

  const toggleTag = (tag) => {
    const normalizedTag = tag.toLowerCase();
    setSelectedTags(prev =>
      prev.includes(normalizedTag)
        ? prev.filter(t => t !== normalizedTag)
        : [...prev, normalizedTag]
    );
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // Filtering logic - runs whenever filters change
  useEffect(() => {
    if (!videos || videos.length === 0) return;

    let result = videos.map(video => ({
      ...video,
      tags: video.tags ? video.tags.map(tag => tag.toLowerCase()) : [],
      duration: video.duration || 0
    }));

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        (video.tags && video.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(video => video.category === selectedCategory);
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(video => {
        if (!video.tags || video.tags.length === 0) return false;
        return selectedTags.every(selectedTag =>
          video.tags.some(videoTag =>
            videoTag.toLowerCase() === selectedTag.toLowerCase()
          )
        );
      });
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'liked':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        result.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredVideos(result);
  }, [searchQuery, selectedCategory, sortBy, videos, selectedTags]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  // Determine if videos should be shown
  const shouldShowVideos = !user || isPrivateMode;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation
        onSearchClick={() => document.getElementById('search-input')?.focus()}
        user={user}
        setUser={setUser}
      />

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
              Explore
            </h1>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-6"></div>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Discover our complete collection of videos. Search, filter, and find exactly what you're looking for.
            </p>
            
            {/* Login Notice for Non-authenticated Users */}
            {!user && (
              <div className="mt-6 max-w-2xl mx-auto">
                <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg px-6 py-4">
                  <p className="text-purple-300 text-sm">
                    <strong>Note:</strong> You're browsing as a guest. Login to like, dislike, and save videos.
                  </p>
                </div>
              </div>
            )}

            {/* Public Mode Warning for Logged-in Users */}
            {user && !isPrivateMode && (
              <div className="mt-6 max-w-2xl mx-auto">
                <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg px-6 py-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>Safe Mode Active:</strong> Videos are hidden. Switch to Private Mode to unlock the vault.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COMBINED SEARCH & FILTER BAR - Only show when videos are visible */}
          {shouldShowVideos && (
            <SearchFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              allTags={allTags}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              onClearAllTags={clearAllTags}
            />
          )}
        </div>
      </div>

      {/* Video Grid Section OR Locked Message */}
      {shouldShowVideos ? (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
          {/* Results Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="text-white/60 text-sm uppercase tracking-wider">
              {filteredVideos.length} {filteredVideos.length === 1 ? 'Video' : 'Videos'} Found
            </div>

            {/* Active Filters Indicator */}
            {(selectedTags.length > 0 || selectedCategory !== 'All' || searchQuery) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40">Active filters:</span>
                {selectedCategory !== 'All' && (
                  <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs">
                    {selectedCategory}
                  </span>
                )}
                {selectedTags.length > 0 && (
                  <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs">
                    {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs">
                    Search: "{searchQuery.substring(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                  </span>
                )}
              </div>
            )}
          </div>

          {/* No Results */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-24 h-24 mx-auto mb-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-white/60 text-xl mb-2">No videos found</p>
              <p className="text-white/40 text-sm mb-6">Try adjusting your search, filters, or tags</p>
              {(searchQuery || selectedCategory !== 'All' || selectedTags.length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSortBy('latest');
                    setSelectedTags([]);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors uppercase tracking-wider text-sm font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            /* Video Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="opacity-0 animate-fadeIn"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <VideoCard
                    video={video}
                    onClick={handleVideoSelect}
                    user={user}
                    onInteraction={handleInteraction}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Public Mode - Locked Vault Message */
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20 min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <svg className="w-32 h-32 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <h2
              className="text-5xl md:text-7xl text-white mb-6 uppercase tracking-[0.3em] font-light"
              style={{
                fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
                textShadow: '0 0 40px rgba(255,255,255,0.2)',
              }}
            >
              Safe Mode
            </h2>

            <div className="h-px w-48 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-8"></div>

            <p className="text-white/60 text-xl mb-4 max-w-2xl mx-auto">
              The vault is sealed. All videos are hidden for your safety.
            </p>

            <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
              Switch to Private Mode using the toggle in the navigation to unlock exclusive content and explore the full collection.
            </p>

            <div className="inline-flex items-center gap-3 px-6 py-3 border border-purple-500/30 bg-purple-600/10 text-purple-300 text-sm uppercase tracking-wider">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Click the lock icon above to unlock</span>
            </div>
          </div>
        </div>
      )}

      <Footer user={user} setUser={setUser} />
    </div>
  );
};

export default ExplorePage;