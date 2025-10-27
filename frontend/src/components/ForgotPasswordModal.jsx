import React, { useState } from 'react';
import { X, Mail, Lock, KeyRound } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Reset modal state
  const resetModal = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }

      setSuccess('OTP sent to your email! Check your inbox.');
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Invalid OTP');
      }

      setSuccess('OTP verified! Set your new password.');
      setTimeout(() => {
        setStep(3);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setSuccess('Password reset successful! You can now login.');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-black border border-white/20 max-w-md w-full p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          disabled={loading}
        >
          <X size={24} />
        </button>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`w-8 h-1 transition-all ${step >= 1 ? 'bg-purple-500' : 'bg-white/20'}`} />
          <div className={`w-8 h-1 transition-all ${step >= 2 ? 'bg-purple-500' : 'bg-white/20'}`} />
          <div className={`w-8 h-1 transition-all ${step >= 3 ? 'bg-purple-500' : 'bg-white/20'}`} />
        </div>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="flex justify-center mb-6">
              <Mail className="text-purple-500" size={48} />
            </div>
            <h2 className="text-2xl text-white text-center mb-2 uppercase tracking-wider font-light">
              Forgot Password
            </h2>
            <p className="text-white/60 text-center text-sm mb-8">
              Enter your email to receive an OTP
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSendOTP}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                         focus:outline-none focus:border-purple-500 transition-all text-sm
                         placeholder:text-white/40 mb-6"
                required
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="border-2 border-white text-white px-8 py-3 uppercase tracking-widest text-sm w-full
                         hover:bg-white hover:text-black transition-all duration-300
                         hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <div className="flex justify-center mb-6">
              <KeyRound className="text-purple-500" size={48} />
            </div>
            <h2 className="text-2xl text-white text-center mb-2 uppercase tracking-wider font-light">
              Verify OTP
            </h2>
            <p className="text-white/60 text-center text-sm mb-8">
              Enter the 6-digit code sent to {email}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleVerifyOTP}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                         focus:outline-none focus:border-purple-500 transition-all text-sm
                         placeholder:text-white/40 mb-4 text-center tracking-widest text-2xl"
                required
                disabled={loading}
                maxLength={6}
              />

              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-white/30 text-white px-6 py-3 uppercase tracking-wider text-xs
                           hover:border-white/50 transition-all duration-300"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="border-2 border-white text-white px-8 py-3 uppercase tracking-widest text-sm flex-1
                           hover:bg-white hover:text-black transition-all duration-300
                           hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                className="text-white/60 hover:text-white text-xs transition-colors w-full text-center"
                disabled={loading}
              >
                Resend OTP
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <div className="flex justify-center mb-6">
              <Lock className="text-purple-500" size={48} />
            </div>
            <h2 className="text-2xl text-white text-center mb-2 uppercase tracking-wider font-light">
              New Password
            </h2>
            <p className="text-white/60 text-center text-sm mb-8">
              Create a strong password
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                         focus:outline-none focus:border-purple-500 transition-all text-sm
                         placeholder:text-white/40 mb-4"
                required
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                         focus:outline-none focus:border-purple-500 transition-all text-sm
                         placeholder:text-white/40 mb-6"
                required
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="border-2 border-white text-white px-8 py-3 uppercase tracking-widest text-sm w-full
                         hover:bg-white hover:text-black transition-all duration-300
                         hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;