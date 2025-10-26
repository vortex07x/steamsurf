import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, X, SkipForward, SkipBack, Repeat, RefreshCw,
  List, ChevronRight, ThumbsUp, ThumbsDown, Bookmark
} from 'lucide-react';
import { formatDuration, formatViews, formatDate } from '../utils/helpers';
import { likeVideo, dislikeVideo, incrementVideoView, saveVideo, unsaveVideo, checkVideoSaved } from '../utils/api';

const VideoPlayer = ({ video, onClose, relatedVideos, onVideoSelect, user, onVideoUpdate }) => {
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [showRelatedVideos, setShowRelatedVideos] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Like/Dislike state
  const [localLikes, setLocalLikes] = useState(video.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(video.dislikes || 0);
  const [userLiked, setUserLiked] = useState(video.userInteraction?.like || false);
  const [userDisliked, setUserDisliked] = useState(video.userInteraction?.dislike || false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  // Save state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Views state
  const [localViews, setLocalViews] = useState(video.views || 0);

  // Use refs to track state and prevent duplicate calls
  const viewIncrementedRef = useRef(false);
  const saveCheckInProgressRef = useRef(false);
  const currentVideoIdRef = useRef(video.id);

  // Refs
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressBarRef = useRef(null);

  // CONSOLIDATED: Sync all video state when video changes
  useEffect(() => {
    console.log('🔄 VideoPlayer: Video changed to', video.id);

    // Update current video ref
    currentVideoIdRef.current = video.id;

    // Reset all states
    setLocalLikes(video.likes || 0);
    setLocalDislikes(video.dislikes || 0);
    setLocalViews(video.views || 0);
    setUserLiked(video.userInteraction?.like || false);
    setUserDisliked(video.userInteraction?.dislike || false);
    setIsPlaying(false);
    setCurrentTime(0);
    setIsSaved(false); // Reset save status, will be checked below

    // Reset view increment flag for new video
    viewIncrementedRef.current = false;
    saveCheckInProgressRef.current = false;

    // Reset video element
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video.id]); // Only run when video.id changes

  // SEPARATE: Check if video is saved (with debouncing and duplicate prevention)
  useEffect(() => {
    let isMounted = true;

    const checkIfSaved = async () => {
      // Prevent multiple simultaneous checks
      if (saveCheckInProgressRef.current) {
        console.log('⏭️ Save check already in progress, skipping');
        return;
      }

      if (!user || !video.id) {
        setIsSaved(false);
        return;
      }

      saveCheckInProgressRef.current = true;

      try {
        const saved = await checkVideoSaved(video.id);
        if (isMounted && currentVideoIdRef.current === video.id) {
          setIsSaved(saved);
        }
      } catch (error) {
        console.error('Error checking if video is saved:', error);
        if (isMounted) {
          setIsSaved(false);
        }
      } finally {
        saveCheckInProgressRef.current = false;
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(() => {
      checkIfSaved();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [video.id, user]); // Only when video or user changes

  // Increment view when video loads (only once per video)
  useEffect(() => {
    let isMounted = true;

    const incrementView = async () => {
      if (!user || viewIncrementedRef.current) {
        return;
      }

      try {
        console.log('🎬 Incrementing view for video:', video.id);
        const result = await incrementVideoView(video.id);

        if (isMounted && currentVideoIdRef.current === video.id) {
          const newViewCount = result.views;
          setLocalViews(newViewCount);
          viewIncrementedRef.current = true;

          // Update parent state
          if (onVideoUpdate) {
            onVideoUpdate(video.id, { views: newViewCount });
          }

          console.log('📊 View count updated to:', newViewCount);
        }
      } catch (error) {
        console.error('❌ Error incrementing view:', error);
      }
    };

    // Small delay to ensure user is watching
    const viewTimer = setTimeout(() => {
      incrementView();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(viewTimer);
    };
  }, [video.id, user, onVideoUpdate]);

  // Handle like button click
  const handleLike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      alert('Please login to like videos');
      return;
    }

    if (isLikeProcessing) return;

    setIsLikeProcessing(true);

    try {
      const result = await likeVideo(video.id);

      // Update local state
      setLocalLikes(result.likes);
      setLocalDislikes(result.dislikes);
      setUserLiked(result.userLiked);
      setUserDisliked(result.userDisliked);

      // Update parent state
      if (onVideoUpdate) {
        onVideoUpdate(video.id, {
          likes: result.likes,
          dislikes: result.dislikes,
          userInteraction: {
            like: result.userLiked,
            dislike: result.userDisliked
          }
        });
      }
    } catch (error) {
      console.error('❌ Error liking video:', error);
      alert(error.message || 'Failed to like video');
    } finally {
      setIsLikeProcessing(false);
    }
  };

  // Handle dislike button click
  const handleDislike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      alert('Please login to dislike videos');
      return;
    }

    if (isLikeProcessing) return;

    setIsLikeProcessing(true);

    try {
      const result = await dislikeVideo(video.id);

      // Update local state
      setLocalLikes(result.likes);
      setLocalDislikes(result.dislikes);
      setUserLiked(result.userLiked);
      setUserDisliked(result.userDisliked);

      // Update parent state
      if (onVideoUpdate) {
        onVideoUpdate(video.id, {
          likes: result.likes,
          dislikes: result.dislikes,
          userInteraction: {
            like: result.userLiked,
            dislike: result.userDisliked
          }
        });
      }
    } catch (error) {
      console.error('❌ Error disliking video:', error);
      alert(error.message || 'Failed to dislike video');
    } finally {
      setIsLikeProcessing(false);
    }
  };

  // Handle save/unsave toggle
  const handleSaveToggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      alert('Please login to save videos');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      if (isSaved) {
        await unsaveVideo(video.id);
        setIsSaved(false);
      } else {
        await saveVideo(video.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert(error.message || 'Failed to save video');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle play/pause
  const togglePlay = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Toggle mute
  const toggleMute = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Seek with progress bar click
  const handleProgressBarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Skip forward 5 seconds
  const skipForward = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 5, duration);
      videoRef.current.currentTime = newTime;
    }
  };

  // Skip backward 5 seconds
  const skipBackward = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 5, 0);
      videoRef.current.currentTime = newTime;
    }
  };

  // Play next video in playlist
  const playNextVideo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (relatedVideos && relatedVideos.length > 0) {
      const currentIndex = relatedVideos.findIndex(v => v.id === video.id);
      const nextIndex = (currentIndex + 1) % relatedVideos.length;
      onVideoSelect(relatedVideos[nextIndex]);
    }
  };

  // Play previous video in playlist
  const playPreviousVideo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (relatedVideos && relatedVideos.length > 0) {
      const currentIndex = relatedVideos.findIndex(v => v.id === video.id);
      const previousIndex = currentIndex === 0 ? relatedVideos.length - 1 : currentIndex - 1;
      onVideoSelect(relatedVideos[previousIndex]);
    }
  };

  // Change playback speed
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Toggle fullscreen
  const toggleFullscreen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toggle loop
  const toggleLoop = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  // Handle mouse move for controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isFullscreen) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Update buffered
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percentage = (bufferedEnd / video.duration) * 100;
        setBuffered(percentage);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);

      // Autoplay next video if enabled
      if (autoplayNext && relatedVideos && relatedVideos.length > 0) {
        setTimeout(() => {
          playNextVideo();
        }, 2000);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [autoplayNext, relatedVideos]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipBackward();
          break;
        case 'arrowright':
          e.preventDefault();
          skipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          const newVolumeUp = Math.min(volume + 0.1, 1);
          setVolume(newVolumeUp);
          if (videoRef.current) videoRef.current.volume = newVolumeUp;
          break;
        case 'arrowdown':
          e.preventDefault();
          const newVolumeDown = Math.max(volume - 0.1, 0);
          setVolume(newVolumeDown);
          if (videoRef.current) videoRef.current.volume = newVolumeDown;
          break;
        case 'n':
          e.preventDefault();
          playNextVideo();
          break;
        case 'p':
          e.preventDefault();
          playPreviousVideo();
          break;
        case '0':
        case 'home':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = 0;
          break;
        case 'end':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = duration;
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [volume, duration]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="min-h-screen">
        {/* Header Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center gap-1 sm:gap-2 text-white/70 hover:text-white transition-colors group"
            >
              <X size={20} className="sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Close Player</span>
              <span className="text-xs font-medium sm:hidden">Close</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  type="checkbox"
                  id="autoplay"
                  checked={autoplayNext}
                  onChange={(e) => setAutoplayNext(e.target.checked)}
                  className="w-3 h-3 sm:w-4 sm:h-4 accent-purple-600"
                />
                <label htmlFor="autoplay" className="text-xs sm:text-sm text-white/70 cursor-pointer select-none">
                  <span className="hidden sm:inline">Autoplay Next</span>
                  <span className="sm:hidden">Autoplay</span>
                </label>
              </div>

              <button
                onClick={() => setShowRelatedVideos(!showRelatedVideos)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 border border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-white transition-all text-xs sm:text-sm"
              >
                <List size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{showRelatedVideos ? 'Hide' : 'Show'} Playlist</span>
                <span className="sm:hidden">{showRelatedVideos ? 'Hide' : 'Show'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-4 sm:py-6 pt-20">
          <div className={`grid gap-4 sm:gap-6 ${showRelatedVideos ? 'grid-cols-1 lg:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
            {/* Video Player Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* Video Player */}
              <div
                ref={containerRef}
                className="relative bg-black rounded-lg overflow-hidden shadow-2xl group"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && !isFullscreen && setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  className="w-full"
                  style={{ aspectRatio: '16/9' }}
                  poster={video.thumbnailUrl}
                  onClick={togglePlay}
                  key={video.id}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                </video>

                {/* Buffering Indicator */}
                {isBuffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30 pointer-events-none">
                    <RefreshCw className="animate-spin text-purple-500" size={48} />
                  </div>
                )}

                {/* Center Controls */}
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-4 sm:gap-8 transition-opacity duration-300 z-20 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                  <button
                    onClick={skipBackward}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-black/90 hover:scale-110 transition-all shadow-2xl border-2 border-white/20 group/skip pointer-events-auto"
                    title="Skip Backward 5s (←)"
                  >
                    <div className="flex flex-col items-center">
                      <SkipBack className="text-white group-hover/skip:text-purple-400 transition-colors" size={20} />
                      <span className="text-white text-[10px] sm:text-xs font-bold mt-0.5">5s</span>
                    </div>
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-600/90 backdrop-blur-sm flex items-center justify-center hover:bg-purple-700 hover:scale-110 transition-all shadow-2xl border-4 border-white/20 pointer-events-auto"
                  >
                    {isPlaying ? (
                      <Pause className="text-white" size={32} />
                    ) : (
                      <Play className="text-white ml-1" size={32} fill="white" />
                    )}
                  </button>

                  <button
                    onClick={skipForward}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-black/90 hover:scale-110 transition-all shadow-2xl border-2 border-white/20 group/skip pointer-events-auto"
                    title="Skip Forward 5s (→)"
                  >
                    <div className="flex flex-col items-center">
                      <SkipForward className="text-white group-hover/skip:text-purple-400 transition-colors" size={20} />
                      <span className="text-white text-[10px] sm:text-xs font-bold mt-0.5">5s</span>
                    </div>
                  </button>
                </div>

                {/* Controls Overlay */}
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent transition-opacity duration-300 z-30 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                  {/* Progress Bar */}
                  <div className="px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-3 pointer-events-auto">
                    <div
                      ref={progressBarRef}
                      className="relative h-1 sm:h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-1.5 sm:hover:h-2 transition-all"
                      onClick={handleProgressBarClick}
                    >
                      <div
                        className="absolute h-full bg-white/30 rounded-full pointer-events-none"
                        style={{ width: `${buffered}%` }}
                      />
                      <div
                        className="absolute h-full bg-purple-600 rounded-full pointer-events-none"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                      />
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="px-2 sm:px-4 pb-2 sm:pb-4 pointer-events-auto">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-1 sm:gap-3">
                        <button onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors p-0.5 sm:p-1" title="Play/Pause (Space/K)">
                          {isPlaying ? <Pause size={20} className="sm:w-7 sm:h-7" /> : <Play size={20} className="sm:w-7 sm:h-7" />}
                        </button>

                        <button onClick={playPreviousVideo} className="text-white hover:text-purple-400 transition-colors p-0.5 sm:p-1" title="Previous Video (P)">
                          <SkipBack size={18} className="sm:w-5 sm:h-5" />
                        </button>

                        <button onClick={playNextVideo} className="text-white hover:text-purple-400 transition-colors p-0.5 sm:p-1" title="Next Video (N)">
                          <SkipForward size={18} className="sm:w-5 sm:h-5" />
                        </button>

                        <div className="hidden sm:flex items-center gap-2 group/volume">
                          <button onClick={toggleMute} className="text-white hover:text-purple-400 transition-colors p-1" title="Mute (M)">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>

                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-0 group-hover/volume:w-16 lg:group-hover/volume:w-20 transition-all duration-300 h-1 rounded-full cursor-pointer appearance-none bg-white/20"
                            style={{
                              background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                            }}
                            title="Volume (↑/↓)"
                          />
                        </div>

                        <button onClick={toggleMute} className="sm:hidden text-white hover:text-purple-400 transition-colors p-0.5" title="Mute">
                          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>

                        <span className="text-white text-[10px] sm:text-sm font-medium whitespace-nowrap hidden md:inline">
                          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                        </span>
                        <span className="text-white text-[10px] font-medium whitespace-nowrap md:hidden">
                          {formatDuration(Math.floor(currentTime))}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-3">
                        <button
                          onClick={toggleLoop}
                          className={`p-0.5 sm:p-1 transition-colors hidden sm:block ${isLooping ? 'text-purple-400' : 'text-white hover:text-purple-400'}`}
                          title="Loop Video"
                        >
                          <Repeat size={18} className="sm:w-5 sm:h-5" />
                        </button>

                        <div className="relative hidden sm:block">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowSpeedMenu(!showSpeedMenu);
                            }}
                            className="text-white hover:text-purple-400 transition-colors flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-white/10"
                            title="Playback Speed"
                          >
                            <Settings size={18} className="sm:w-5 sm:h-5" />
                            <span className="text-[10px] sm:text-xs font-medium min-w-[1.5rem] sm:min-w-[2rem] text-center">{playbackSpeed}x</span>
                          </button>

                          {showSpeedMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg shadow-2xl py-2 min-w-[100px] sm:min-w-[120px] border border-white/10">
                              <div className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Speed</div>
                              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                <button
                                  key={speed}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSpeedChange(speed);
                                  }}
                                  className={`block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm transition-colors ${playbackSpeed === speed ? 'bg-purple-600 text-white' : 'text-white/80 hover:bg-white/10'}`}
                                >
                                  {speed === 1 ? 'Normal' : `${speed}x`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button onClick={toggleFullscreen} className="text-white hover:text-purple-400 transition-colors p-0.5 sm:p-1" title="Fullscreen (F)">
                          {isFullscreen ? <Minimize size={18} className="sm:w-6 sm:h-6" /> : <Maximize size={18} className="sm:w-6 sm:h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white mb-2 sm:mb-3 leading-tight">
                    {video.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/60 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">{formatViews(localViews)} views</span>
                    </div>
                    <span className="text-white/30">•</span>
                    <span className="hidden sm:inline">{formatDate(video.createdAt)}</span>
                    <span className="sm:hidden">{new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {/* Like/Dislike/Save Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleLike}
                      disabled={isLikeProcessing || !user}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all text-sm sm:text-base ${userLiked
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-white'
                        } ${!user || isLikeProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={!user ? 'Login to like videos' : 'Like this video'}
                    >
                      <ThumbsUp size={16} className="sm:w-5 sm:h-5" fill={userLiked ? 'currentColor' : 'none'} />
                      <span className="font-medium">{formatViews(localLikes)}</span>
                    </button>

                    <button
                      onClick={handleDislike}
                      disabled={isLikeProcessing || !user}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all text-sm sm:text-base ${userDisliked
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-white'
                        } ${!user || isLikeProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={!user ? 'Login to dislike videos' : 'Dislike this video'}
                    >
                      <ThumbsDown size={16} className="sm:w-5 sm:h-5" fill={userDisliked ? 'currentColor' : 'none'} />
                      <span className="font-medium">{formatViews(localDislikes)}</span>
                    </button>

                    {/* SAVE BUTTON */}
                    <button
                      onClick={handleSaveToggle}
                      disabled={isSaving || !user}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all text-sm sm:text-base ${isSaved
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-white'
                        } ${!user || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={!user ? 'Login to save videos' : isSaved ? 'Remove from saved' : 'Save for later'}
                    >
                      <Bookmark size={16} className="sm:w-5 sm:h-5" fill={isSaved ? 'currentColor' : 'none'} />
                      <span className="font-medium">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    {!user && (
                      <span className="text-xs text-white/40 ml-1 sm:ml-2">Login to interact</span>
                    )}
                  </div>
                </div>

                {/* Category and Description */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium uppercase tracking-wider">
                      {video.category}
                    </span>
                    <span className="text-white/40 text-xs sm:text-sm">
                      Duration: {formatDuration(video.duration)}
                    </span>
                  </div>

                  <p className="text-white/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {video.description}
                  </p>
                </div>

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm text-white/60 uppercase tracking-wider mb-2 sm:mb-3 font-medium">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 border border-white/10 text-white/70 text-xs sm:text-sm hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-purple-300 transition-all cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyboard Shortcuts */}
                <details className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <summary className="px-4 sm:px-6 py-3 sm:py-4 cursor-pointer text-white/80 text-sm sm:text-base font-medium hover:bg-white/5 transition-colors select-none">
                    ⌨️ Keyboard Shortcuts
                  </summary>
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Play/Pause</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">Space / K</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Fullscreen</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">F</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Skip Forward 5s</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">→</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Skip Backward 5s</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">←</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Next Video</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">N</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Previous Video</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">P</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Volume Up</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">↑</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Volume Down</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">↓</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Mute</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">M</kbd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Go to Start</span>
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded text-white/80 font-mono text-[10px] sm:text-xs">0 / Home</kbd>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Related Videos Sidebar */}
            {showRelatedVideos && relatedVideos && relatedVideos.length > 0 && (
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <List size={18} className="sm:w-5 sm:h-5 text-purple-400" />
                      Up Next
                    </h3>
                    <span className="text-[10px] sm:text-xs text-white/50 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      {relatedVideos.length} videos
                    </span>
                  </div>

                  <div className="max-h-[400px] sm:max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {relatedVideos.map((relVideo, index) => {
                      const isCurrentVideo = relVideo.id === video.id;

                      return (
                        <div
                          key={relVideo.id}
                          onClick={() => !isCurrentVideo && onVideoSelect(relVideo)}
                          className={`flex gap-2 sm:gap-3 p-2 sm:p-3 transition-all border-b border-white/5 last:border-b-0 ${isCurrentVideo
                            ? 'bg-purple-600/20 border-l-4 border-l-purple-500'
                            : 'hover:bg-white/5 cursor-pointer group'
                            }`}
                        >
                          <div className="relative w-32 sm:w-40 flex-shrink-0">
                            <img
                              src={relVideo.thumbnailUrl}
                              alt={relVideo.title}
                              className={`w-full h-20 sm:h-24 object-cover rounded transition-transform ${!isCurrentVideo && 'group-hover:scale-105'}`}
                            />

                            <div className="absolute bottom-1 right-1 px-1 sm:px-1.5 py-0.5 bg-black/90 rounded text-[10px] sm:text-xs text-white font-medium">
                              {formatDuration(relVideo.duration)}
                            </div>

                            {!isCurrentVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                                <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={28} fill="white" />
                              </div>
                            )}

                            {isCurrentVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="flex items-center gap-1 sm:gap-2 text-white">
                                  <div className="w-1 h-2 sm:h-3 bg-purple-500 animate-pulse"></div>
                                  <div className="w-1 h-3 sm:h-4 bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-1 h-2 sm:h-3 bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                              </div>
                            )}

                            <div className="absolute top-1 left-1 w-5 h-5 sm:w-6 sm:h-6 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] sm:text-xs text-white font-bold">
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className={`text-xs sm:text-sm font-medium line-clamp-2 leading-tight mb-1 transition-colors ${isCurrentVideo ? 'text-purple-300' : 'text-white group-hover:text-purple-400'}`}>
                                {relVideo.title}
                              </h4>

                              <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[10px] sm:text-xs rounded mt-1">
                                {relVideo.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-white/50 mt-1 sm:mt-2">
                              <span>{formatViews(relVideo.views)} views</span>
                              <span>•</span>
                              <span>{formatViews(relVideo.likes)} likes</span>
                            </div>

                            {autoplayNext && index === 0 && !isCurrentVideo && (
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-purple-400 mt-1 sm:mt-2">
                                <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="font-medium">Up next</span>
                              </div>
                            )}

                            {isCurrentVideo && (
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-purple-400 mt-1 sm:mt-2 font-medium">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                Now Playing
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;