import React, { useState, useEffect } from 'react';
import { Search, Upload, Edit2, Trash2, Save, X, Plus, AlertCircle } from 'lucide-react';
import { getAllVideosAdmin, uploadVideo, updateVideoDetails, deleteVideoAdmin, fetchAllTags } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmModal from '../ConfirmModal';
import AlertModal from '../AlertModal';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVideo, setEditingVideo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Other',
    tags: [],
    videoFile: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    tags: [],
    newTag: ''
  });

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    loadVideos();
    loadTags();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await getAllVideosAdmin();
      setVideos(data);
      setFilteredVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
      showAlert('error', 'Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await fetchAllTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const showAlert = (type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        showAlert('warning', 'Invalid File', 'Please select a valid video file');
        return;
      }
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        showAlert('warning', 'File Too Large', 'File size must be less than 100MB');
        return;
      }
      setUploadForm({ ...uploadForm, videoFile: file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.videoFile) {
      showAlert('warning', 'No File Selected', 'Please select a video file');
      return;
    }

    if (!uploadForm.title || !uploadForm.description) {
      showAlert('warning', 'Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', uploadForm.videoFile);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('tags', JSON.stringify(uploadForm.tags));

      await uploadVideo(formData, (progress) => {
        setUploadProgress(progress);
      });

      showAlert('success', 'Success', 'Video uploaded successfully!');
      setShowUploadForm(false);
      setUploadForm({
        title: '',
        description: '',
        category: 'Other',
        tags: [],
        videoFile: null
      });
      setUploadProgress(0);
      await loadVideos();
      await loadTags();
    } catch (error) {
      console.error('Upload error:', error);
      showAlert('error', 'Upload Failed', error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video.id);
    setEditForm({
      title: video.title,
      tags: [...video.tags],
      newTag: ''
    });
  };

  const handleSaveEdit = async (videoId) => {
    try {
      setProcessing(true);
      await updateVideoDetails(videoId, {
        title: editForm.title,
        tags: editForm.tags
      });
      await loadVideos();
      await loadTags();
      setEditingVideo(null);
      showAlert('success', 'Success', 'Video updated successfully');
    } catch (error) {
      console.error('Error updating video:', error);
      showAlert('error', 'Error', error.message || 'Failed to update video');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteVideo = (videoId, title) => {
    setConfirmModal({
      isOpen: true,
      data: { videoId, title },
      action: 'delete'
    });
  };

  const confirmDeleteVideo = async () => {
    const { videoId } = confirmModal.data;
    try {
      setProcessing(true);
      await deleteVideoAdmin(videoId);
      await loadVideos();
      await loadTags();
      showAlert('success', 'Success', 'Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      showAlert('error', 'Error', error.message || 'Failed to delete video');
    } finally {
      setProcessing(false);
    }
  };

  const addTag = () => {
    const tag = editForm.newTag.trim().toLowerCase();
    if (tag && !editForm.tags.includes(tag)) {
      setEditForm({
        ...editForm,
        tags: [...editForm.tags, tag],
        newTag: ''
      });
    }
  };

  const removeTag = (tagToRemove) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addUploadTag = () => {
    const tag = uploadForm.newTag?.trim().toLowerCase();
    if (tag && !uploadForm.tags.includes(tag)) {
      setUploadForm({
        ...uploadForm,
        tags: [...uploadForm.tags, tag],
        newTag: ''
      });
    }
  };

  const removeUploadTag = (tagToRemove) => {
    setUploadForm({
      ...uploadForm,
      tags: uploadForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-white/5 border border-white/10 text-white pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors uppercase tracking-wider text-sm font-medium whitespace-nowrap"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Upload Video</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white/5 border border-purple-500/30 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-serif text-white">Upload New Video</h3>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-white/60 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Video File *</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full bg-white/10 border border-white/20 text-white px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              {uploadForm.videoFile && (
                <p className="text-white/60 text-xs sm:text-sm mt-2">
                  Selected: {uploadForm.videoFile.name} ({(uploadForm.videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Title *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                disabled={uploading}
                className="w-full bg-white/10 border border-white/20 text-white px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 disabled:opacity-50"
                placeholder="Enter video title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Description *</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                disabled={uploading}
                className="w-full bg-white/10 border border-white/20 text-white px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 disabled:opacity-50 min-h-[80px] sm:min-h-[100px]"
                placeholder="Enter video description"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Category *</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                disabled={uploading}
                className="w-full bg-white/10 border border-white/20 text-white px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 disabled:opacity-50"
              >
                <option value="Music">Music</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Gaming">Gaming</option>
                <option value="Vlog">Vlog</option>
                <option value="Documentary">Documentary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Tags</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={uploadForm.newTag || ''}
                  onChange={(e) => setUploadForm({ ...uploadForm, newTag: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUploadTag())}
                  disabled={uploading}
                  className="flex-1 bg-white/10 border border-white/20 text-white px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addUploadTag}
                  disabled={uploading}
                  className="px-3 sm:px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uploadForm.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs sm:text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeUploadTag(tag)}
                      disabled={uploading}
                      className="hover:text-purple-100 disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-white/70 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !uploadForm.videoFile}
              className="w-full py-2.5 sm:py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors uppercase tracking-wider text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </form>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">
            No videos found
          </div>
        ) : (
          filteredVideos.map(video => (
            <div key={video.id} className="bg-white/5 border border-white/10 overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative" style={{ aspectRatio: '16/9' }}>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-white text-xs">
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 space-y-3">
                {editingVideo === video.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />

                    {/* Tags Editor */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editForm.newTag}
                          onChange={(e) => setEditForm({ ...editForm, newTag: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
                          placeholder="Add tag..."
                        />
                        <button
                          onClick={addTag}
                          className="p-1 text-purple-400 hover:text-purple-300"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {editForm.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-purple-100"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(video.id)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingVideo(null)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <h3 className="text-white font-medium line-clamp-2 text-sm sm:text-base">{video.title}</h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs">
                        {video.category}
                      </span>
                      <span className={`px-2 py-1 text-xs ${
                        video.isPublished
                          ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                          : 'bg-red-600/20 text-red-300 border border-red-500/30'
                      }`}>
                        {video.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {video.tags.length > 3 && (
                          <span className="text-white/40 text-xs">
                            +{video.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEditVideo(video)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id, video.title)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-600/10 border border-purple-500/30 p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <AlertCircle className="text-purple-400 flex-shrink-0 mt-0.5" size={18} />
        <div className="text-xs sm:text-sm text-white/70">
          <p className="font-semibold text-white mb-1">Video Management Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Upload videos directly to Cloudinary (max 100MB)</li>
            <li>Edit video titles and tags after upload</li>
            <li>Tags are automatically updated in the Explore page filters</li>
            <li>Deleting a video removes it from Cloudinary and database</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, data: null })}
        onConfirm={confirmDeleteVideo}
        title="Delete Video"
        message={`Are you sure you want to delete "${confirmModal.data?.title}"? This will remove the video from both Cloudinary and the database. This action cannot be undone.`}
        confirmText="Delete Video"
        variant="danger"
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, type: 'info', title: '', message: '' })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />
    </div>
  );
};

export default VideoManagement;