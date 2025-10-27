// Use environment variable if available, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============= HEALTH CHECK API =============

// Check if backend is awake
export const checkBackendHealth = async () => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      }
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      isAwake: response.ok,
      responseTime,
      isColdStart: responseTime > 5000 // Consider cold start if > 5 seconds
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Health check failed:', error);
    return {
      isAwake: false,
      responseTime,
      isColdStart: responseTime > 5000,
      error: error.message
    };
  }
};

// ============= VIDEO APIs =============

// Fetch all videos
export const fetchVideos = async () => {
  try {
    const token = getAuthToken();
    console.log('🔍 API: Fetching videos with token:', token ? 'YES' : 'NO');
    console.log('🔍 API: Using base URL:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/videos`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('🔍 API: Response from backend:', result.data?.length, 'videos');
    
    return result.data;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

// Fetch single video by ID
export const fetchVideoById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
};

// Increment view count
export const incrementVideoView = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/view`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error incrementing view:', error);
    throw error;
  }
};

// Like video
export const likeVideo = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/like`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to like video');
    }

    return result.data;
  } catch (error) {
    console.error('Error liking video:', error);
    throw error;
  }
};

// Dislike video
export const dislikeVideo = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/dislike`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to dislike video');
    }

    return result.data;
  } catch (error) {
    console.error('Error disliking video:', error);
    throw error;
  }
};

// Search videos
export const searchVideos = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos?search=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
};

// Filter videos by category
export const filterByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos?category=${encodeURIComponent(category)}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error filtering videos:', error);
    throw error;
  }
};

// Get all tags
export const fetchAllTags = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/tags`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

// ============= AUTH APIs =============

// Register new user
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    // Store token
    if (result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result.data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    // Store token and user data
    if (result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    // Clear local storage regardless of response
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    return true;
  } catch (error) {
    // Still clear local storage on error
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.error('Error during logout:', error);
    return true;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const result = await response.json();
    
    // Update local storage
    if (result.data) {
      localStorage.setItem('user', JSON.stringify(result.data));
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Update user mode (private/public)
export const updateUserMode = async (mode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/mode`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update mode');
    }

    // Update user in local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.mode = mode;
    localStorage.setItem('user', JSON.stringify(user));

    return result.data;
  } catch (error) {
    console.error('Error updating mode:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Get stored user data
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

// ============= ADMIN APIs =============

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch users');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update role');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

// Update user email (admin only)
export const updateUserEmail = async (userId, email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/email`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update email');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete user');
    }

    return result.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get all videos for admin (includes unpublished)
export const getAllVideosAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/videos`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch videos');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching admin videos:', error);
    throw error;
  }
};

// Upload video with progress (admin only)
export const uploadVideo = async (formData, onProgress) => {
  try {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          resolve(result.data);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${API_BASE_URL}/admin/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken()}`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

// Update video details (admin only)
export const updateVideoDetails = async (videoId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/videos/${videoId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update video');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
};

// Delete video (admin only)
export const deleteVideoAdmin = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/videos/${videoId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete video');
    }

    return result.data;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

// Get user activity (admin only)
export const getUserActivity = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/activity`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch activity');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
};

// Cleanup old activities (admin only)
export const cleanupOldActivities = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/activity/cleanup`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to cleanup activities');
    }

    return result;
  } catch (error) {
    console.error('Error cleaning up activities:', error);
    throw error;
  }
};

// ============= SAVED VIDEOS & HISTORY APIs =============

// Save video
export const saveVideo = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/save`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to save video');
    }

    return result.data;
  } catch (error) {
    console.error('Error saving video:', error);
    throw error;
  }
};

// Unsave video
export const unsaveVideo = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/unsave`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to unsave video');
    }

    return result.data;
  } catch (error) {
    console.error('Error unsaving video:', error);
    throw error;
  }
};

// Check if video is saved
export const checkVideoSaved = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/is-saved`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to check save status');
    }

    return result.data.isSaved;
  } catch (error) {
    console.error('Error checking save status:', error);
    return false;
  }
};

// Get saved videos
export const fetchSavedVideos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/saved`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch saved videos');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    throw error;
  }
};

// Get view history
export const fetchViewHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/history`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch view history');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching view history:', error);
    throw error;
  }
};