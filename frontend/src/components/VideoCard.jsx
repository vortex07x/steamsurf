import React, { useState, useEffect } from 'react';
import { Play, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { formatDuration, formatViews } from '../utils/helpers';
import { likeVideo, dislikeVideo } from '../utils/api';

const VideoCard = ({ video, onClick, user, onInteraction }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localLikes, setLocalLikes] = useState(video.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(video.dislikes || 0);
  const [userLiked, setUserLiked] = useState(video.userInteraction?.like || false);
  const [userDisliked, setUserDisliked] = useState(video.userInteraction?.dislike || false);
  const [interacting, setInteracting] = useState(false);

  // Sync local state when video prop changes
  useEffect(() => {
    setLocalLikes(video.likes || 0);
    setLocalDislikes(video.dislikes || 0);
    setUserLiked(video.userInteraction?.like || false);
    setUserDisliked(video.userInteraction?.dislike || false);
  }, [video.likes, video.dislikes, video.userInteraction]);

  const handleLike = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Please login to like videos');
      return;
    }

    if (interacting) return;
    setInteracting(true);

    try {
      const result = await likeVideo(video.id);
      setLocalLikes(result.likes);
      setLocalDislikes(result.dislikes);
      setUserLiked(result.userLiked);
      setUserDisliked(result.userDisliked);
      
      if (onInteraction) {
        onInteraction(video.id, 'like', result);
      }
    } catch (error) {
      console.error('Error liking video:', error);
      alert(error.message || 'Failed to like video');
    } finally {
      setInteracting(false);
    }
  };

  const handleDislike = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Please login to dislike videos');
      return;
    }

    if (interacting) return;
    setInteracting(true);

    try {
      const result = await dislikeVideo(video.id);
      setLocalLikes(result.likes);
      setLocalDislikes(result.dislikes);
      setUserLiked(result.userLiked);
      setUserDisliked(result.userDisliked);
      
      if (onInteraction) {
        onInteraction(video.id, 'dislike', result);
      }
    } catch (error) {
      console.error('Error disliking video:', error);
      alert(error.message || 'Failed to dislike video');
    } finally {
      setInteracting(false);
    }
  };

  return (
    <div
      className="group cursor-pointer transition-all duration-300"
      style={{
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(video)}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-black/50 border border-white/10" style={{ aspectRatio: '16/9' }}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 border border-white/20">
            <Play className="text-white ml-1" size={28} fill="white" />
          </div>
        </div>
        
        {/* Duration Badge */}
        {video.duration !== undefined && video.duration !== null && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm text-xs text-white font-medium border border-white/10">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Category Badge */}
        {video.category && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600/80 backdrop-blur-sm text-xs text-white font-medium uppercase tracking-wider border border-purple-400/30">
            {video.category}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="mt-4 px-1">
        <h3 className="text-white font-serif text-base font-semibold line-clamp-2 group-hover:text-purple-400 transition-colors leading-tight mb-2">
          {video.title}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            <span>{formatViews(video.views || 0)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <ThumbsUp size={14} className={userLiked ? 'text-purple-400' : ''} />
            <span className={userLiked ? 'text-purple-400' : ''}>{formatViews(localLikes)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <ThumbsDown size={14} className={userDisliked ? 'text-red-400' : ''} />
            <span className={userDisliked ? 'text-red-400' : ''}>{formatViews(localDislikes)}</span>
          </div>
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {video.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-white/5 border border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-purple-300 transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Filter by tag
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {user && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleLike}
              disabled={interacting}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-all border ${
                userLiked
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-purple-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsUp size={14} />
              Like
            </button>
            
            <button
              onClick={handleDislike}
              disabled={interacting}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-all border ${
                userDisliked
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-red-600/20 hover:border-red-500/30 hover:text-red-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsDown size={14} />
              Dislike
            </button>
          </div>
        )}

        {/* Login Prompt for Non-authenticated */}
        {!user && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-xs text-white/50 italic">Login to like or dislike</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;