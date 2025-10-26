import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import UserManagement from '../components/admin/UserManagement';
import VideoManagement from '../components/admin/VideoManagement';
import UserActivity from '../components/admin/UserActivity';
import { Shield, Users, Video, Activity } from 'lucide-react';

const AdminPage = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    setLoading(false);
  }, [user, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'videos', label: 'Video Management', icon: Video },
    { id: 'activity', label: 'User Activity', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation
        onSearchClick={() => {}}
        user={user}
        setUser={setUser}
      />

      {/* Admin Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 bg-gradient-to-b from-black via-black to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <Shield className="text-purple-500" size={36} />
            </div>
            <h1
              className="text-3xl sm:text-5xl md:text-7xl text-white mb-4 sm:mb-6 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-light"
              style={{
                fontFamily: "'Cinzel Decorative', 'Playfair Display', serif",
                textShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
              }}
            >
              Admin Dashboard
            </h1>
            <div className="h-px w-32 sm:w-48 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-4 sm:mb-6"></div>
            <p className="text-white/60 text-sm sm:text-lg px-4">
              Manage users, videos, and monitor activity
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap px-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 border text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-purple-500 bg-purple-600 text-white'
                      : 'border-white/20 text-white/70 hover:border-purple-500/50 hover:text-purple-400'
                  }`}
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === 'users' ? 'Users' : tab.id === 'videos' ? 'Videos' : 'Activity'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'videos' && <VideoManagement />}
        {activeTab === 'activity' && <UserActivity />}
      </div>

      <Footer user={user} setUser={setUser} />
    </div>
  );
};

export default AdminPage;