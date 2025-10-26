import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import AdminPage from './pages/AdminPage';
import DungeonPage from './pages/DungeonPage';
import VideoPlayer from './components/VideoPlayer';
import { fetchVideos, getCurrentUser, isAuthenticated } from './utils/api';

// Main App Component with Router Logic
function AppContent() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getCurrentUser();
          console.log('✅ User authenticated:', userData);
          setUser(userData);
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } else {
        console.log('⚠️ No authentication token found');
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch all videos on mount
  useEffect(() => {
    const loadAllVideos = async () => {
      try {
        const data = await fetchVideos();
        console.log('📥 App.jsx: Loaded videos:', data.length);

        const normalizedVideos = data.map(video => ({
          ...video,
          likes: video.likes ?? 0,
          dislikes: video.dislikes ?? 0,
          views: video.views ?? 0,
          userInteraction: video.userInteraction || { like: false, dislike: false }
        }));

        setAllVideos(normalizedVideos);
      } catch (error) {
        console.error('❌ Error fetching videos:', error);
      }
    };
    loadAllVideos();
  }, []);

  const handleVideoSelect = (video) => {
    console.log('🎬 App.jsx: Video selected:', video.title);
    console.log('👤 Current user:', user ? user.email || user.username : 'Not logged in');

    // Find the latest version of the video from allVideos
    const latestVideo = allVideos.find(v => v.id === video.id) || video;

    // Ensure all stats are defined
    const normalizedVideo = {
      ...latestVideo,
      likes: latestVideo.likes ?? 0,
      dislikes: latestVideo.dislikes ?? 0,
      views: latestVideo.views ?? 0,
      userInteraction: latestVideo.userInteraction || { like: false, dislike: false }
    };

    console.log('📊 Video stats:', {
      likes: normalizedVideo.likes,
      dislikes: normalizedVideo.dislikes,
      views: normalizedVideo.views
    });

    setSelectedVideo(normalizedVideo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoUpdate = (videoId, updates) => {
    console.log('🔄 App.jsx: Updating video:', videoId);
    console.log('📊 Updates received:', updates);

    setAllVideos(prevVideos => {
      const updatedVideos = prevVideos.map(v => {
        if (v.id === videoId) {
          const updated = {
            ...v,
            likes: updates.likes !== undefined ? updates.likes : v.likes,
            dislikes: updates.dislikes !== undefined ? updates.dislikes : v.dislikes,
            views: updates.views !== undefined ? updates.views : v.views,
            userInteraction: updates.userInteraction
              ? { ...v.userInteraction, ...updates.userInteraction }
              : v.userInteraction
          };

          console.log('✅ Updated video in allVideos:', {
            id: updated.id,
            likes: updated.likes,
            dislikes: updated.dislikes,
            views: updated.views,
            userInteraction: updated.userInteraction
          });
          return updated;
        }
        return v;
      });
      return updatedVideos;
    });

    setSelectedVideo(prevSelected => {
      if (prevSelected && prevSelected.id === videoId) {
        const updated = {
          ...prevSelected,
          likes: updates.likes !== undefined ? updates.likes : prevSelected.likes,
          dislikes: updates.dislikes !== undefined ? updates.dislikes : prevSelected.dislikes,
          views: updates.views !== undefined ? updates.views : prevSelected.views,
          userInteraction: updates.userInteraction
            ? { ...prevSelected.userInteraction, ...updates.userInteraction }
            : prevSelected.userInteraction
        };

        console.log('✅ Updated selectedVideo:', {
          id: updated.id,
          likes: updated.likes,
          dislikes: updated.dislikes,
          views: updated.views,
          userInteraction: updated.userInteraction
        });
        return updated;
      }
      return prevSelected;
    });
  };

  const getRelatedVideos = (currentVideo) => {
    if (!allVideos.length) return [];

    return allVideos
      .filter(v => v.id !== currentVideo.id &&
        (v.category === currentVideo.category ||
          (v.tags && currentVideo.tags && v.tags.some(tag => currentVideo.tags.includes(tag)))))
      .slice(0, 10);
  };

  // Close video player when route changes
  useEffect(() => {
    if (selectedVideo) {
      console.log('🚪 Route changed, closing video player');
    }
    setSelectedVideo(null);
  }, [location.pathname]);

  // If video is selected, show video player overlay
  if (selectedVideo) {
    const relatedVideos = getRelatedVideos(selectedVideo);
    
    console.log('🎥 Rendering VideoPlayer with:', {
      videoId: selectedVideo.id,
      likes: selectedVideo.likes,
      dislikes: selectedVideo.dislikes,
      views: selectedVideo.views,
      relatedVideosCount: relatedVideos.length,
      user: user ? user.email || user.username : 'Not logged in'
    });

    return (
      <VideoPlayer
        video={selectedVideo}
        onClose={() => {
          console.log('🚪 Closing VideoPlayer');
          setSelectedVideo(null);
        }}
        relatedVideos={relatedVideos}
        onVideoSelect={handleVideoSelect}
        user={user}
        onVideoUpdate={handleVideoUpdate}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            onVideoSelect={handleVideoSelect}
            user={user}
            setUser={setUser}
            authLoading={authLoading}
            videos={allVideos}
            onVideoUpdate={handleVideoUpdate}
          />
        }
      />
      <Route
        path="/explore"
        element={
          <ExplorePage
            onVideoSelect={handleVideoSelect}
            user={user}
            setUser={setUser}
            videos={allVideos}
            onVideoUpdate={handleVideoUpdate}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <AdminPage
            user={user}
            setUser={setUser}
          />
        }
      />
      <Route
        path="/dungeon"
        element={
          <DungeonPage
            onVideoSelect={handleVideoSelect}
            user={user}
            setUser={setUser}
            onVideoUpdate={handleVideoUpdate}
          />
        }
      />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-8xl font-bold text-white/20 mb-4">404</h1>
              <p className="text-white/60 text-xl mb-8">Page Not Found</p>
              <button
                onClick={() => navigate('/')}
                className="border border-white/40 text-white px-8 py-3 text-sm uppercase tracking-widest
                         hover:bg-white hover:text-black transition-all duration-300"
              >
                Go Home
              </button>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;