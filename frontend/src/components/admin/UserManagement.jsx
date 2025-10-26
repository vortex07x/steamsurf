import React, { useState, useEffect } from 'react';
import { Search, Mail, Shield, Trash2, AlertCircle, Check, X } from 'lucide-react';
import { getAllUsers, updateUserRole, updateUserEmail, deleteUser } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmModal from '../ConfirmModal';
import AlertModal from '../AlertModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      showAlert('error', 'Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const handleRoleChange = async (userId, newRole) => {
    setConfirmModal({
      isOpen: true,
      data: { userId, newRole },
      action: 'role'
    });
  };

  const confirmRoleChange = async () => {
    const { userId, newRole } = confirmModal.data;
    try {
      setProcessing(true);
      await updateUserRole(userId, newRole);
      await loadUsers();
      showAlert('success', 'Success', 'Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      showAlert('error', 'Error', error.message || 'Failed to update role');
    } finally {
      setProcessing(false);
    }
  };

  const handleEmailUpdate = async (userId) => {
    if (!newEmail || !newEmail.includes('@')) {
      showAlert('warning', 'Invalid Email', 'Please enter a valid email address');
      return;
    }

    setConfirmModal({
      isOpen: true,
      data: { userId, email: newEmail },
      action: 'email'
    });
  };

  const confirmEmailUpdate = async () => {
    const { userId, email } = confirmModal.data;
    try {
      setProcessing(true);
      await updateUserEmail(userId, email);
      await loadUsers();
      setEditingUser(null);
      setNewEmail('');
      showAlert('success', 'Success', 'Email updated successfully');
    } catch (error) {
      console.error('Error updating email:', error);
      showAlert('error', 'Error', error.message || 'Failed to update email');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setConfirmModal({
      isOpen: true,
      data: { userId, username },
      action: 'delete'
    });
  };

  const confirmDeleteUser = async () => {
    const { userId } = confirmModal.data;
    try {
      setProcessing(true);
      await deleteUser(userId);
      await loadUsers();
      showAlert('success', 'Success', 'User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('error', 'Error', error.message || 'Failed to delete user');
    } finally {
      setProcessing(false);
    }
  };

  const getConfirmModalConfig = () => {
    const { action, data } = confirmModal;

    if (action === 'role') {
      return {
        title: 'Change User Role',
        message: `Are you sure you want to change this user's role to ${data?.newRole}?`,
        confirmText: 'Change Role',
        variant: 'warning',
        onConfirm: confirmRoleChange
      };
    }

    if (action === 'email') {
      return {
        title: 'Update Email',
        message: `Are you sure you want to update the email to ${data?.email}?`,
        confirmText: 'Update Email',
        variant: 'info',
        onConfirm: confirmEmailUpdate
      };
    }

    if (action === 'delete') {
      return {
        title: 'Delete User',
        message: `Are you sure you want to delete user "${data?.username}"? This action cannot be undone.`,
        confirmText: 'Delete User',
        variant: 'danger',
        onConfirm: confirmDeleteUser
      };
    }

    return {};
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white/5 border border-white/10 text-white pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="text-white/60 text-sm text-center sm:text-left">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white/5 border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Mode
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-white/40">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.username}</div>
                          <div className="text-white/40 text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="bg-white/10 border border-white/20 text-white px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
                            placeholder="New email"
                          />
                          <button
                            onClick={() => handleEmailUpdate(user.id)}
                            disabled={processing}
                            className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setNewEmail('');
                            }}
                            disabled={processing}
                            className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-white/70 text-sm">{user.email}</span>
                          <button
                            onClick={() => {
                              setEditingUser(user.id);
                              setNewEmail(user.email);
                            }}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <Mail size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={processing}
                        className="bg-white/10 border border-white/20 text-white px-3 py-1 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${user.mode === 'private'
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'bg-white/10 text-white/70 border border-white/20'
                        }`}>
                        {user.mode === 'private' ? '🔒 Private' : '🌐 Public'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${user.isActive
                          ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                          : 'bg-red-600/20 text-red-300 border border-red-500/30'
                        }`}>
                        {user.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={processing || user.role === 'admin'}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-8 text-center text-white/40">
            No users found
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="bg-white/5 border border-white/10 p-4 space-y-3">
              {/* User Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{user.username}</div>
                  <div className="text-white/40 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="text-white/60 text-xs uppercase tracking-wider">Email</div>
                {editingUser === user.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                      placeholder="New email"
                    />
                    <button
                      onClick={() => handleEmailUpdate(user.id)}
                      disabled={processing}
                      className="p-2 text-green-400 hover:text-green-300 disabled:opacity-50"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setNewEmail('');
                      }}
                      disabled={processing}
                      className="p-2 text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm truncate">{user.email}</span>
                    <button
                      onClick={() => {
                        setEditingUser(user.id);
                        setNewEmail(user.email);
                      }}
                      className="text-purple-400 hover:text-purple-300 p-1"
                    >
                      <Mail size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1">
                <div className="text-white/60 text-xs uppercase tracking-wider">Role</div>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={processing}
                  className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Mode & Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${user.mode === 'private'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/10 text-white/70 border border-white/20'
                  }`}>
                  {user.mode === 'private' ? '🔒 Private' : '🌐 Public'}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${user.isActive
                    ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                    : 'bg-red-600/20 text-red-300 border border-red-500/30'
                  }`}>
                  {user.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteUser(user.id, user.username)}
                disabled={processing || user.role === 'admin'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                {user.role === 'admin' ? 'Cannot Delete Admin' : 'Delete User'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-600/10 border border-purple-500/30 p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <AlertCircle className="text-purple-400 flex-shrink-0 mt-0.5" size={18} />
        <div className="text-xs sm:text-sm text-white/70">
          <p className="font-semibold text-white mb-1">User Management Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Change user roles to grant admin access</li>
            <li>Update user emails directly from this panel</li>
            <li>Delete users (cannot delete admins for security)</li>
            <li>Monitor user mode (Private/Public) and status</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, data: null })}
        {...getConfirmModalConfig()}
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

export default UserManagement;