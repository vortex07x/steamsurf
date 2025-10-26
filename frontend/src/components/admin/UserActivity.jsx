import React, { useState, useEffect } from 'react';
import { Search, Eye, ThumbsUp, ThumbsDown, Calendar, Video, Trash2, RefreshCw } from 'lucide-react';
import { getUserActivity, cleanupOldActivities } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmModal from '../ConfirmModal';
import AlertModal from '../AlertModal';

const UserActivity = () => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [cleaning, setCleaning] = useState(false);

    // Modal states
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        loadActivities();
        // Auto cleanup on component mount
        autoCleanup();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, filterType, dateRange, activities]);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const data = await getUserActivity();
            setActivities(data);
        } catch (error) {
            console.error('Error loading activities:', error);
            showAlert('error', 'Error', 'Failed to load user activity');
        } finally {
            setLoading(false);
        }
    };

    const autoCleanup = async () => {
        try {
            // Silently cleanup old activities (older than 1 day)
            await cleanupOldActivities();
        } catch (error) {
            console.error('Auto cleanup error:', error);
            // Don't show error to user for auto cleanup
        }
    };

    const showAlert = (type, title, message) => {
        setAlertModal({ isOpen: true, type, title, message });
    };

    const handleManualCleanup = () => {
        setConfirmModal({
            isOpen: true,
            action: 'cleanup'
        });
    };

    const confirmCleanup = async () => {
        try {
            setCleaning(true);
            const result = await cleanupOldActivities();
            await loadActivities();
            showAlert('success', 'Cleanup Complete', `Deleted ${result.deletedCount || 0} old activity records (older than 24 hours)`);
        } catch (error) {
            console.error('Cleanup error:', error);
            showAlert('error', 'Error', error.message || 'Failed to cleanup old activities');
        } finally {
            setCleaning(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...activities];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(activity =>
                activity.username?.toLowerCase().includes(query) ||
                activity.videoTitle?.toLowerCase().includes(query)
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(activity => activity.type === filterType);
        }

        // Date range filter
        if (dateRange !== 'all') {
            const now = new Date();
            const cutoffDate = new Date();

            switch (dateRange) {
                case 'today':
                    cutoffDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoffDate.setMonth(now.getMonth() - 1);
                    break;
            }

            filtered = filtered.filter(activity =>
                new Date(activity.createdAt) >= cutoffDate
            );
        }

        setFilteredActivities(filtered);
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'view':
                return <Eye size={16} className="text-blue-400" />;
            case 'like':
                return <ThumbsUp size={16} className="text-green-400" />;
            case 'dislike':
                return <ThumbsDown size={16} className="text-red-400" />;
            default:
                return <Video size={16} className="text-white/40" />;
        }
    };

    const getActivityText = (type) => {
        switch (type) {
            case 'view':
                return 'viewed';
            case 'like':
                return 'liked';
            case 'dislike':
                return 'disliked';
            default:
                return 'interacted with';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    // Calculate statistics
    const stats = {
        total: filteredActivities.length,
        views: filteredActivities.filter(a => a.type === 'view').length,
        likes: filteredActivities.filter(a => a.type === 'like').length,
        dislikes: filteredActivities.filter(a => a.type === 'dislike').length
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <div className="space-y-3 sm:space-y-4">
                {/* Search & Cleanup */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by username or video..."
                            className="w-full bg-white/5 border border-white/10 text-white pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleManualCleanup}
                        disabled={cleaning}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm uppercase tracking-wider disabled:opacity-50 whitespace-nowrap"
                    >
                        {cleaning ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span className="hidden sm:inline">Cleaning...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Cleanup Old Data</span>
                                <span className="sm:hidden">Cleanup</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Filter Options - FIXED DROPDOWNS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-white/60 text-sm whitespace-nowrap">Type:</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="flex-1 sm:flex-none bg-black border-2 border-purple-500/50 text-white px-3 sm:px-4 py-2 text-sm focus:outline-none focus:border-purple-500 hover:border-purple-500 transition-colors cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a855f7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '2.5rem',
                                appearance: 'none'
                            }}
                        >
                            <option value="all" className="bg-black text-white">All Activities</option>
                            <option value="view" className="bg-black text-white">Views</option>
                            <option value="like" className="bg-black text-white">Likes</option>
                            <option value="dislike" className="bg-black text-white">Dislikes</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-white/60 text-sm whitespace-nowrap">Period:</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="flex-1 sm:flex-none bg-black border-2 border-purple-500/50 text-white px-3 sm:px-4 py-2 text-sm focus:outline-none focus:border-purple-500 hover:border-purple-500 transition-colors cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a855f7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '2.5rem',
                                appearance: 'none'
                            }}
                        >
                            <option value="all" className="bg-black text-white">All Time</option>
                            <option value="today" className="bg-black text-white">Today</option>
                            <option value="week" className="bg-black text-white">Last 7 Days</option>
                            <option value="month" className="bg-black text-white">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/5 border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/60 text-xs sm:text-sm mb-1">Total</p>
                            <p className="text-white text-xl sm:text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <Video className="text-purple-400" size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/60 text-xs sm:text-sm mb-1">Views</p>
                            <p className="text-white text-xl sm:text-2xl font-bold">{stats.views}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <Eye className="text-blue-400" size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/60 text-xs sm:text-sm mb-1">Likes</p>
                            <p className="text-white text-xl sm:text-2xl font-bold">{stats.likes}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                            <ThumbsUp className="text-green-400" size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/60 text-xs sm:text-sm mb-1">Dislikes</p>
                            <p className="text-white text-xl sm:text-2xl font-bold">{stats.dislikes}</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                            <ThumbsDown className="text-red-400" size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Table - Desktop */}
            <div className="hidden md:block bg-white/5 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                                    Activity
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                                    Video
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActivities.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-white/40">
                                        No activity found
                                    </td>
                                </tr>
                            ) : (
                                filteredActivities.map((activity) => (
                                    <tr key={activity.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                                    {activity.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{activity.username || 'Unknown User'}</div>
                                                    <div className="text-white/40 text-xs">{activity.userEmail || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getActivityIcon(activity.type)}
                                                <span className="text-white/70 capitalize">{getActivityText(activity.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white/80 line-clamp-2 max-w-md">
                                                {activity.videoTitle || 'Unknown Video'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-white/60 text-sm">
                                                <Calendar size={14} />
                                                {formatDate(activity.createdAt)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity Cards - Mobile */}
            <div className="md:hidden space-y-3">
                {filteredActivities.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-8 text-center text-white/40">
                        No activity found
                    </div>
                ) : (
                    filteredActivities.map((activity) => (
                        <div key={activity.id} className="bg-white/5 border border-white/10 p-4 space-y-3">
                            {/* User */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                    {activity.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">{activity.username || 'Unknown User'}</div>
                                    <div className="text-white/40 text-xs truncate">{activity.userEmail || ''}</div>
                                </div>
                            </div>

                            {/* Activity */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getActivityIcon(activity.type)}
                                    <span className="text-white/70 capitalize text-sm">{getActivityText(activity.type)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/60 text-xs">
                                    <Calendar size={12} />
                                    {formatDate(activity.createdAt)}
                                </div>
                            </div>

                            {/* Video */}
                            <div className="pt-2 border-t border-white/10">
                                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Video</div>
                                <div className="text-white/80 text-sm line-clamp-2">
                                    {activity.videoTitle || 'Unknown Video'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Info */}
            {filteredActivities.length > 0 && (
                <div className="text-center text-white/60 text-sm">
                    Showing {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
                </div>
            )}

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmCleanup}
                title="Cleanup Old Activities"
                message="This will delete all activity records older than 24 hours. This action cannot be undone. Continue?"
                confirmText="Yes, Cleanup"
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

export default UserActivity;